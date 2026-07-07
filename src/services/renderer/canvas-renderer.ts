import { Canvas, createCanvas, loadImage, Image } from "@napi-rs/canvas";
import { Input, FilePathSource, ALL_FORMATS } from "mediabunny";
import { renderVideoNodeToContext } from "./nodes/video-node";
import { renderImageNodeToContext } from "./nodes/image-node";
import { renderTextNodeToContext } from "./nodes/text-node";
import { EditorManifest } from "../../types/opencut";
import { RemoteFontLoader } from "./font-loader";
import * as av from "node-av";
import * as path from "path";

export class CanvasRenderer {
  public canvas: Canvas;
  public context: any;
  public width: number;
  public height: number;
  public fps: number;

  private inputsMap: Record<string, Input> = {};
  private videoSinksMap: Record<string, any> = {};
  private imagesMap: Record<string, Image> = {};
  private audioDemuxers: av.Demuxer[] = [];
  private audioDecodersMap: Record<string, av.Decoder> = {};
  private complexFilter: av.FilterComplexAPI | null = null;
  private audioFramesGenerator: AsyncGenerator<av.Frame | null> | null = null;

  constructor({ width, height, fps }: { width: number; height: number; fps: number }) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.canvas = createCanvas(width, height);
    this.context = this.canvas.getContext("2d");
  }

  /**
   * Tính toán tổng thời lượng video dựa trên track video chính
   */
  public calculateDuration(manifest: EditorManifest): number {
    const mainVideoTrack = manifest.tracks.find(t => t.type === "video" && (t as any).isMain);
    if (!mainVideoTrack) return 0;
    return mainVideoTrack.elements.reduce((acc, el) => acc + el.duration, 0);
  }

  /**
   * Dựng hình ảnh timeline lên skia-canvas tại thời điểm time
   */
  public async render({ manifest, time }: { manifest: EditorManifest; time: number }): Promise<void> {
    const ctx = this.context;
    
    // Clear frame về màu đen
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);

    // Tải assets và font ở background nếu chưa có
    await this.ensureAssetsLoaded(manifest);

    // Duyệt qua các track vẽ đè lên nhau
    for (const track of manifest.tracks) {
      if (track.type === "video") {
        for (const el of track.elements) {
          if (time >= el.startTime && time < el.startTime + el.duration) {
            if (el.type === "video") {
              await renderVideoNodeToContext({ el, time, ctx, videoSinksMap: this.videoSinksMap });
            } else if (el.type === "image") {
              renderImageNodeToContext({ el, ctx, imagesMap: this.imagesMap });
            }
          }
        }
      } else if (track.type === "text") {
        for (const el of track.elements) {
          if (time >= el.startTime && time < el.startTime + el.duration) {
            renderTextNodeToContext({ el, ctx, canvasWidth: this.width, canvasHeight: this.height });
          }
        }
      }
    }
  }

  /**
   * Gom tất cả các phần tử có luồng âm thanh
   */
  public collectAudioClips(manifest: EditorManifest): any[] {
    const clips: any[] = [];
    for (const track of manifest.tracks) {
      if (track.type === "audio") {
        clips.push(...track.elements);
      } else if (track.type === "video") {
        clips.push(...track.elements.filter(el => el.type === "video"));
      }
    }
    return clips;
  }

  /**
   * Khởi tạo FilterGraph amix native của NodeAV để mix các luồng âm thanh
   */
  public async setupAudioMix(clips: any[]): Promise<void> {
    const filterParts: string[] = [];
    const audioLabels: string[] = [];
    const filterInputsMap: Record<string, any> = {};
    let audioInputIdx = 0;

    for (const clip of clips) {
      try {
        const demuxer = await av.Demuxer.open(clip.sourceUrl);
        const stream = demuxer.audio();
        if (stream) {
          this.audioDemuxers.push(demuxer);
          const key = `${audioInputIdx}:a`;
          const decoder = await av.Decoder.create(stream);
          this.audioDecodersMap[key] = decoder;
          
          const delayMs = Math.round(clip.startTime * 1000);
          const label = `a_${clip.id}`;
          const vol = clip.volume !== undefined ? clip.volume : 1.0;

          // Cắt audio theo trimStart và delay phát theo startTime trên timeline
          filterParts.push(`[${audioInputIdx}:a]atrim=start=${clip.trimStart},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${vol}[${label}]`);
          audioLabels.push(`[${label}]`);

          // Nạp generator giới hạn thời lượng của Decoder vào filter input map
          filterInputsMap[key] = this.limitGenerator(
            decoder.frames(demuxer.packets(stream.index)),
            clip.duration
          );

          audioInputIdx++;
        } else {
          demuxer[Symbol.dispose]();
        }
      } catch (err) {
        console.warn(`[CanvasRenderer] Không thể nạp âm thanh của clip ${clip.sourceUrl}:`, err);
      }
    }

    let finalAudioLabel = "";
    if (audioLabels.length > 1) {
      filterParts.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=shortest:normalize=0[a_final]`);
      finalAudioLabel = "a_final";
    } else if (audioLabels.length === 1) {
      filterParts.push(`${audioLabels[0]}anull[a_final]`);
      finalAudioLabel = "a_final";
    } else {
      // Trường hợp không có luồng audio nào, tạo luồng audio trống
      filterParts.push(`anullsrc=sample_rate=48000:channel_layout=stereo[a_final]`);
      finalAudioLabel = "a_final";
    }
    
    const filterComplexString = filterParts.join("; ");
    const filterComplexInputConfigs = Object.keys(this.audioDecodersMap).map(label => ({ label }));
    const filterComplexOutputConfigs = [{ label: finalAudioLabel, mediaType: av.AVMEDIA_TYPE_AUDIO }];
    
    this.complexFilter = av.FilterComplexAPI.create(filterComplexString, {
      inputs: filterComplexInputConfigs,
      outputs: filterComplexOutputConfigs,
    });

    this.audioFramesGenerator = this.complexFilter.frames(finalAudioLabel, filterInputsMap);
  }

  /**
   * Đọc các frame audio đã được mix và đẩy vào track của Mediabunny Output
   */
  public async pushAudioFrames(audioSource: any): Promise<void> {
    if (!this.audioFramesGenerator) return;

    while (true) {
      let audioFrame: av.Frame | null | undefined = null;
      try {
        const { value, done } = await this.audioFramesGenerator.next();
        audioFrame = value;
        if (done || !audioFrame) break;
      } catch (err) {
        break;
      }

      const { AudioSample } = await import("mediabunny");
      const { AvFrameAudioSampleResource } = await import("@mediabunny/server");
      const audioSample = new AudioSample(new AvFrameAudioSampleResource(audioFrame));
      await audioSource.add(audioSample);
      audioSample.close();
    }
  }

  private async *limitGenerator(
    generator: AsyncIterable<av.Frame | null>,
    duration: number
  ): AsyncGenerator<av.Frame | null, void, unknown> {
    let audioDurationSec = 0;

    for await (const frame of generator) {
      if (!frame) break;

      const sampleRate = frame.sampleRate || 44100;
      const samples = frame.nbSamples || 1024;
      audioDurationSec += samples / sampleRate;
      if (audioDurationSec > duration) {
        frame[Symbol.dispose]();
        break;
      }

      yield frame;
    }
  }

  /**
   * Đảm bảo tất cả nguyên liệu (video sinks, static images, remote fonts) được nạp đầy đủ
   */
  private async ensureAssetsLoaded(manifest: EditorManifest): Promise<void> {
    for (const track of manifest.tracks) {
      for (const el of track.elements) {
        if ("sourceUrl" in el && el.sourceUrl) {
          const key = el.id;
          if (el.type === "video" && !this.inputsMap[key]) {
            const input = new Input({ source: new FilePathSource(el.sourceUrl), formats: ALL_FORMATS });
            this.inputsMap[key] = input;
            const videoTracks = await input.getVideoTracks();
            const track = videoTracks[0];
            if (track) {
              const { VideoSampleSink } = await import("mediabunny");
              this.videoSinksMap[key] = new VideoSampleSink(track, {
                hardwareAcceleration: (process.env.HARDWARE_ACCELERATION as any) || "no-preference",
              });
            }
          } else if (el.type === "image" && !this.imagesMap[key]) {
            const src = el.sourceUrl.startsWith("http") ? el.sourceUrl : path.resolve(el.sourceUrl);
            const img = await loadImage(src);
            this.imagesMap[key] = img;
          }
        }

        // Tự động tải remote font nếu được khai báo
        if (el.type === "text" && el.style.fontUrl) {
          await RemoteFontLoader.useRemote(el.style.fontFamily, el.style.fontUrl);
        }
      }
    }
  }

  /**
   * Giải phóng tài nguyên demuxer và decoder
   */
  public async dispose(): Promise<void> {
    for (const d of this.audioDemuxers) {
      try { d[Symbol.dispose](); } catch {}
    }
    for (const key in this.audioDecodersMap) {
      try { this.audioDecodersMap[key][Symbol.dispose](); } catch {}
    }
    for (const key in this.inputsMap) {
      try { await this.inputsMap[key].dispose(); } catch {}
    }
  }
}
