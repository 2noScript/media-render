import { ProjectManifest, BaseTimelineElement, VideoTrack, AudioTrack } from "../types/opencut";
import * as av from "node-av";
import * as fs from "fs";
import * as path from "path";

// Interface đại diện cho clip sau khi tiền xử lý
interface PreparedInput {
  inputIndex: number;
  sourceUrl: string;
  type: "video" | "image" | "audio";
  elementId: string;
  startTime: number;
  duration: number;
  trimStart: number;
  volume?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
}

export class OpenCutRenderService {
  public async renderProject(manifest: ProjectManifest): Promise<string> {
    const outputDir = path.resolve("./test-outputs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `output-${crypto.randomUUID()}.${manifest.settings.format}`);
    console.log(`[RenderService] Starting render execution for project: ${manifest.projectId}`);

    // ==========================================================
    // STAGE 1: TIỀN XỬ LÝ TIMELINE & LẬP DANH SÁCH INPUTS
    // ==========================================================
    const preparedInputs: PreparedInput[] = [];
    let currentInputIdx = 0;

    // Tìm track video chính làm nền
    const mainVideoTrack = manifest.tracks.find(t => t.type === "video" && (t as VideoTrack).isMain) as VideoTrack | undefined;
    if (!mainVideoTrack) {
      throw new Error("No main video track found in project manifest.");
    }

    // Lấp khoảng trống (Gap Filling) cho track video chính
    const mainElementsWithGaps = this.fillTrackGaps(mainVideoTrack.elements);
    
    // Nạp các elements của track video chính vào danh sách inputs
    for (const el of mainElementsWithGaps) {
      const sourceUrl = (el as any).sourceUrl;
      const type = (el as any).type;
      
      if (sourceUrl !== "solid-black-color") {
        preparedInputs.push({
          inputIndex: currentInputIdx++,
          sourceUrl: sourceUrl,
          type: type,
          elementId: el.id,
          startTime: el.startTime,
          duration: el.duration,
          trimStart: el.trimStart,
          volume: (el as any).volume || 1.0,
          x: (el as any).x || 0,
          y: (el as any).y || 0,
          width: (el as any).width || manifest.settings.width,
          height: (el as any).height || manifest.settings.height,
        });
      } else {
        // Đây là clip đệm khoảng trống màu đen thô
        preparedInputs.push({
          inputIndex: -1, // Đánh dấu là clip sinh tự động (không cần file input)
          sourceUrl: "solid-black-color",
          type: "image",
          elementId: el.id,
          startTime: el.startTime,
          duration: el.duration,
          trimStart: 0,
        });
      }
    }

    // Nạp các overlay tracks (video overlays & stickers)
    const overlayTracks = manifest.tracks.filter(t => t.type === "video" && !(t as VideoTrack).isMain) as VideoTrack[];
    for (const track of overlayTracks) {
      for (const el of track.elements) {
        const sourceUrl = (el as any).sourceUrl;
        const type = (el as any).type;
        preparedInputs.push({
          inputIndex: currentInputIdx++,
          sourceUrl: sourceUrl,
          type: type,
          elementId: el.id,
          startTime: el.startTime,
          duration: el.duration,
          trimStart: el.trimStart,
          volume: (el as any).volume || 1.0,
          x: (el as any).x || 0,
          y: (el as any).y || 0,
          width: (el as any).width || 300,
          height: (el as any).height || 300,
          opacity: (el as any).opacity || 1.0,
        });
      }
    }

    // Nạp các tracks audio
    const audioTracks = manifest.tracks.filter(t => t.type === "audio") as AudioTrack[];
    for (const track of audioTracks) {
      for (const el of track.elements) {
        const sourceUrl = (el as any).sourceUrl;
        preparedInputs.push({
          inputIndex: currentInputIdx++,
          sourceUrl: sourceUrl,
          type: "audio",
          elementId: el.id,
          startTime: el.startTime,
          duration: el.duration,
          trimStart: el.trimStart,
          volume: el.volume || 1.0,
        });
      }
    }

    console.log(`[RenderService] Stage 1 completed. Total physical inputs: ${currentInputIdx}`);

    // ==========================================================
    // STAGE 2: BIÊN DỊCH FFMEG FILTER COMPLEX GRAPH
    // ==========================================================
    const filterParts: string[] = [];
    
    // 1. Dựng các luồng video riêng lẻ (trim, scale, setpts) cho main track
    const videoMainClips = preparedInputs.filter(p => p.type !== "audio" && mainElementsWithGaps.some(el => el.id === p.elementId));
    const mainVideoLabels: string[] = [];

    for (const clip of videoMainClips) {
      const label = `v_${clip.elementId}`;
      if (clip.inputIndex === -1) {
        // Sinh khung hình đen thô cho khoảng trống
        filterParts.push(`color=c=black:s=${manifest.settings.width}x${manifest.settings.height}:d=${clip.duration}:r=${manifest.settings.fps}[${label}]`);
      } else if (clip.type === "image") {
        filterParts.push(`[${clip.inputIndex}:v]scale=${clip.width}:${clip.height},loop=loop=-1:size=1:start=0,trim=duration=${clip.duration},setpts=PTS-STARTPTS[${label}]`);
      } else {
        filterParts.push(`[${clip.inputIndex}:v]trim=start=${clip.trimStart}:duration=${clip.duration},setpts=PTS-STARTPTS,scale=${clip.width}:${clip.height}[${label}]`);
      }
      // Lưu lại nhãn của main track để nối tiếp
      const isMainTrackClip = mainElementsWithGaps.some(el => el.id === clip.elementId);
      if (isMainTrackClip) {
        mainVideoLabels.push(`[${label}]`);
      }
    }

    // Nối tiếp các clips của Main Video Track thành luồng nền: [v_main_base]
    if (mainVideoLabels.length > 1) {
      filterParts.push(`${mainVideoLabels.join("")}concat=n=${mainVideoLabels.length}:v=1:a=0[v_main_base]`);
    } else if (mainVideoLabels.length === 1) {
      filterParts.push(`${mainVideoLabels[0]}split=1[v_main_base]`);
    }

    // 2. Chồng đè các Video Overlay clips lên luồng nền
    let currentBaseLabel = "v_main_base";
    const overlayClips = preparedInputs.filter(p => p.type !== "audio" && !mainElementsWithGaps.some(el => el.id === p.elementId));
    
    let overlayCount = 0;
    for (const clip of overlayClips) {
      const clipLabel = `v_${clip.elementId}`;
      const nextBaseLabel = `v_base_overlay_${overlayCount++}`;
      
      // Xử lý clip overlay thô trước
      if (clip.type === "image") {
        filterParts.push(`[${clip.inputIndex}:v]scale=${clip.width}:${clip.height},loop=loop=-1:size=1:start=0,trim=duration=${clip.duration},setpts=PTS-STARTPTS[${clipLabel}]`);
      } else {
        filterParts.push(`[${clip.inputIndex}:v]trim=start=${clip.trimStart}:duration=${clip.duration},setpts=PTS-STARTPTS,scale=${clip.width}:${clip.height}[${clipLabel}]`);
      }

      // Đè overlay lên nền tại thời điểm startTime
      filterParts.push(`[${currentBaseLabel}][${clipLabel}]overlay=x=${clip.x}:y=${clip.y}:enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'[${nextBaseLabel}]`);
      currentBaseLabel = nextBaseLabel;
    }

    // 3. Tạo luồng chữ phụ đề (Text Overlay)
    const textTracks = manifest.tracks.filter(t => t.type === "text");
    let textOverlayCount = 0;
    for (const track of textTracks) {
      for (const el of track.elements) {
        const nextBaseLabel = `v_text_overlay_${textOverlayCount++}`;
        const escapedText = el.text.replace(/'/g, "'\\''");
        const fontSize = el.style?.fontSize || 24;
        const color = el.style?.color || "white";
        const x = el.style?.x || 100;
        const y = el.style?.y || 100;

        filterParts.push(`[${currentBaseLabel}]drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${color}:x=${x}:y=${y}:enable='between(t,${el.startTime},${el.startTime + el.duration})'[${nextBaseLabel}]`);
        currentBaseLabel = nextBaseLabel;
      }
    }
    // Gán nhãn Video đầu ra cuối cùng
    const finalVideoLabel = currentBaseLabel;

    // 4. Dựng luồng audio (delay và mix)
    const audioClips = preparedInputs.filter(p => p.type === "audio");
    const audioLabels: string[] = [];
    
    for (const clip of audioClips) {
      const label = `a_${clip.elementId}`;
      const delayMs = Math.round(clip.startTime * 1000);
      filterParts.push(`[${clip.inputIndex}:a]atrim=start=${clip.trimStart}:duration=${clip.duration},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${clip.volume || 1.0}[${label}]`);
      audioLabels.push(`[${label}]`);
    }

    // Trộn toàn bộ âm thanh
    let finalAudioLabel = "";
    if (audioLabels.length > 1) {
      filterParts.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:normalize=0[a_final]`);
      finalAudioLabel = "a_final";
    } else if (audioLabels.length === 1) {
      filterParts.push(`${audioLabels[0]}anull[a_final]`);
      finalAudioLabel = "a_final";
    }

    const filterComplexString = filterParts.join("; ");
    console.log(`[RenderService] Stage 2 completed. Filter Complex Graph built:\n${filterComplexString}`);

    // ==========================================================
    // STAGE 3: THỰC THI RENDERING QUA FFMEG / NODE-AV NATIVE
    // ==========================================================
    console.log(`[RenderService] Stage 3: Initializing demuxers & encoders.`);
    
    // Khởi tạo các Demuxer thô
    const demuxers: av.Demuxer[] = [];
    for (let i = 0; i < currentInputIdx; i++) {
      const clipConfig = preparedInputs.find(p => p.inputIndex === i);
      if (clipConfig) {
        const demuxer = await av.Demuxer.open(clipConfig.sourceUrl);
        demuxers.push(demuxer);
      }
    }

    // Cấu hình định dạng output
    const isWebm = manifest.settings.format === "webm";
    const videoEncoderName = isWebm ? av.FF_ENCODER_LIBVPX_VP9 : av.FF_ENCODER_LIBX264;
    const audioEncoderName = isWebm ? av.FF_ENCODER_OPUS : av.FF_ENCODER_AAC;

    const muxer = await av.Muxer.open(outputPath);

    // Khởi tạo các Decoder cho từng track của demuxer
    const decodersMap: Record<string, av.Decoder> = {};
    for (const p of preparedInputs) {
      if (p.inputIndex >= 0) {
        const demuxer = demuxers[p.inputIndex];
        const stream = p.type === "audio" ? demuxer.audio() : demuxer.video();
        if (stream) {
          decodersMap[`${p.inputIndex}:${p.type === "audio" ? "a" : "v"}`] = await av.Decoder.create(stream);
        }
      }
    }

    // Khởi tạo encoder và ghi dữ liệu
    const videoEncoder = await av.Encoder.create(videoEncoderName as any, {
      context: { 
        width: manifest.settings.width,
        height: manifest.settings.height,
        timeBase: new av.Rational(1, manifest.settings.fps)
      }
    });
    const videoStreamIndex = muxer.addStream(videoEncoder);
    
    let audioEncoder: av.Encoder | null = null;
    let audioStreamIndex = -1;
    if (audioLabels.length > 0) {
      audioEncoder = await av.Encoder.create(audioEncoderName as any, {
        context: {
          timeBase: new av.Rational(1, 44100)
        }
      });
      audioStreamIndex = muxer.addStream(audioEncoder);
    }

    // Khởi tạo Filter Complex API của NodeAV
    const filterComplexInputConfigs = preparedInputs
      .filter(p => p.inputIndex >= 0)
      .map(p => ({
        label: `${p.inputIndex}:${p.type === "audio" ? "a" : "v"}`,
      }));

    const filterComplexOutputConfigs = [
      { label: finalVideoLabel, mediaType: av.AVMEDIA_TYPE_VIDEO },
    ];
    if (audioLabels.length > 0) {
      filterComplexOutputConfigs.push({ label: finalAudioLabel, mediaType: av.AVMEDIA_TYPE_AUDIO });
    }

    const complexFilter = av.FilterComplexAPI.create(filterComplexString, {
      inputs: filterComplexInputConfigs,
      outputs: filterComplexOutputConfigs,
    });

    console.log("[RenderService] Engine is rendering frame processing loop...");

    try {
      // 1. Chuẩn bị các input streams cho complex filter
      const filterInputsMap: Record<string, AsyncIterable<av.Frame | null>> = {};
      for (const p of preparedInputs) {
        if (p.inputIndex >= 0) {
          const key = `${p.inputIndex}:${p.type === "audio" ? "a" : "v"}`;
          const decoder = decodersMap[key];
          const demuxer = demuxers[p.inputIndex];
          const stream = p.type === "audio" ? demuxer.audio() : demuxer.video();
          if (stream) {
            filterInputsMap[key] = decoder.frames(demuxer.packets(stream.index));
          }
        }
      }

      // 2. Chạy vòng lặp kéo video frames từ filter complex, đồng thời kéo cả audio frames từ bộ đệm của complex
      console.log("[RenderService] Processing interleaved streams...");
      for await (const videoFrame of complexFilter.frames(finalVideoLabel, filterInputsMap)) {
        if (videoFrame) {
          // Encode video frame
          const packets = await videoEncoder.encodeAll(videoFrame);
          for (const packet of packets) {
            await muxer.writePacket(packet, videoStreamIndex);
            packet[Symbol.dispose]();
          }
        }

        // Kéo và encode audio frame sẵn có trong bộ đệm của complex filter (nếu có)
        if (audioEncoder && finalAudioLabel && audioStreamIndex >= 0) {
          while (true) {
            let audioFrame: av.Frame | null | undefined = null;
            try {
              audioFrame = await complexFilter.receive(finalAudioLabel);
            } catch (err) {
              audioFrame = null;
            }
            if (!audioFrame) break;

            const packets = await audioEncoder.encodeAll(audioFrame);
            for (const packet of packets) {
              await muxer.writePacket(packet, audioStreamIndex);
              packet[Symbol.dispose]();
            }
            audioFrame[Symbol.dispose]();
          }
        }
      }

      // Flush video encoder
      const remainingVideoPackets = await videoEncoder.encodeAll(null);
      for (const packet of remainingVideoPackets) {
        await muxer.writePacket(packet, videoStreamIndex);
        packet[Symbol.dispose]();
      }

      // Flush audio encoder
      if (audioEncoder && audioStreamIndex >= 0) {
        const remainingAudioPackets = await audioEncoder.encodeAll(null);
        for (const packet of remainingAudioPackets) {
          await muxer.writePacket(packet, audioStreamIndex);
          packet[Symbol.dispose]();
        }
      }

      console.log(`[RenderService] Pipeline completed! Target file successfully generated.`);

      // Giải phóng bộ nhớ
      for (const key in decodersMap) {
        decodersMap[key][Symbol.dispose]();
      }
      videoEncoder[Symbol.dispose]();
      audioEncoder?.[Symbol.dispose]();
    } catch (err) {
      console.error("[RenderService] Error during media pipeline execution:", err);
      throw err;
    } finally {
      complexFilter.close();
      for (const d of demuxers) {
        d[Symbol.dispose]();
      }
      await muxer.close();
      muxer[Symbol.dispose]();
    }

    console.log(`[RenderService] Export done! Saved to: ${outputPath}`);
    return outputPath;
  }

  // Thuật toán lấp đầy khoảng trống (Gap Filler)
  private fillTrackGaps(elements: BaseTimelineElement[]): BaseTimelineElement[] {
    const sorted = [...elements].sort((a, b) => a.startTime - b.startTime);
    const result: BaseTimelineElement[] = [];
    let timelineCursor = 0;

    for (const clip of sorted) {
      const gap = clip.startTime - timelineCursor;
      if (gap > 0) {
        result.push({
          id: `gap-${crypto.randomUUID()}`,
          name: "black-frame-gap",
          startTime: timelineCursor,
          duration: gap,
          trimStart: 0,
          trimEnd: 0,
          type: "image",
          sourceUrl: "solid-black-color"
        } as any);
      }
      result.push(clip);
      timelineCursor = clip.startTime + clip.duration;
    }
    return result;
  }
}
