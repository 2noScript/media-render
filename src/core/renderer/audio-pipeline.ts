import * as av from "node-av";
import { Manifest } from "../../types/manifest";
import { AudioSample } from "mediabunny";
import { AvFrameAudioSampleResource } from "@mediabunny/server";

export class AudioPipeline {
  /** Array of active media demuxers */
  private audioDemuxers: av.Demuxer[] = [];
  /** Caches active decoders mapped by their filter port labels */
  private audioDecodersMap: Record<string, av.Decoder> = {};
  /** NodeAV FilterComplex instance driving the mix graph */
  private complexFilter: av.FilterComplexAPI | null = null;
  /** Generator loop pulling mixed PCM audio frames */
  private audioFramesGenerator: AsyncGenerator<av.Frame | null> | null = null;

  /**
   * Helper to collect all timeline elements containing active audio streams
   * @param manifest The EditorManifest containing timeline tracks
   * @returns Array of clips containing audio streams
   */
  public collectAudioClips(manifest: Manifest): any[] {
    const clips: any[] = [];
    for (const track of manifest.tracks) {
      if (track.type === "audio") {
        clips.push(...track.elements);
      } else if (track.type === "video") {
        clips.push(...track.elements.filter((el: any) => el.type === "video"));
      }
    }
    return clips;
  }

  /**
   * Sets up NodeAV native FilterGraph (amix) for multi-track audio mixing
   * @param clips Array of target audio clips to mix
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
          const vol = clip.volume !== undefined ? clip.volume : (clip.params?.["volume"] !== undefined ? clip.params["volume"] : 1.0);

          // Set trimming offsets and target timeline start delays
          filterParts.push(`[${audioInputIdx}:a]atrim=start=${clip.trimStart},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${vol}[${label}]`);
          audioLabels.push(`[${label}]`);

          // Register a duration-limited frame generator to the input map
          filterInputsMap[key] = this.limitGenerator(
            decoder.frames(demuxer.packets(stream.index)),
            clip.duration
          );

          audioInputIdx++;
        } else {
          demuxer[Symbol.dispose]();
        }
      } catch (err) {
        console.warn(`[AudioPipeline] Failed to load audio stream from clip ${clip.sourceUrl}:`, err);
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
      // In case of no audio tracks, generate a silent audio stream
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
   * Pulls mixed audio frames from the generator and feeds them to the MediaBunny output stream
   * @param audioSource MediaBunny AudioSampleSource writer target
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

      const audioSample = new AudioSample(new AvFrameAudioSampleResource(audioFrame));
      await audioSource.add(audioSample);
      audioSample.close();
    }
  }

  /**
   * Restricts generator packets to prevent streaming samples past the clip duration boundary
   */
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
   * Releases demuxer and decoder resources
   */
  public dispose(): void {
    for (const d of this.audioDemuxers) {
      try {
        d[Symbol.dispose]();
      } catch {}
    }
    for (const key in this.audioDecodersMap) {
      try {
        this.audioDecodersMap[key][Symbol.dispose]();
      } catch {}
    }
  }
}
