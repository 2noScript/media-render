import "./bootstrap";

import { Output, Mp4OutputFormat, WebMOutputFormat, FilePathTarget, CanvasSource, AudioSampleSource } from "mediabunny";
import { CanvasRenderer } from "./canvas-renderer";
import { EditorManifest } from "../../types/editor-manifest";
import { QUALITY_MAP } from "../../lib/constants";
import { fsExists, fsMkdir } from "../../lib/helpers";
import * as path from "path";
import * as crypto from "crypto";



export async function exporter(manifest: EditorManifest, onProgress?: (progress: number) => void, customOutputPath?: string): Promise<string> {
    const { width, height, fps, format } = manifest.settings;
    const quality = manifest.settings.quality || "high";
    const shouldIncludeAudio = manifest.settings.shouldIncludeAudio ?? false;

    const renderer = new CanvasRenderer({ width, height, fps });

    const outputDir = customOutputPath ? path.dirname(customOutputPath) : path.resolve("./test-outputs");
    if (!fsExists(outputDir)) {
      await fsMkdir(outputDir);
    }
    const outputPath = customOutputPath || path.join(outputDir, `${manifest.id || `output-${crypto.randomUUID()}`}.${format}`);
    const fpsFloat = fps;
    const timeStep = 1 / fpsFloat;

    console.log(`[Exporter] Initiating video export (${quality}): ${manifest.id} -> ${outputPath}`);

    const output = new Output({
      format: format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target: new FilePathTarget(outputPath),
    });

    // 1. Direct bind of renderer virtual Canvas object to CanvasSource
    const canvasObj = renderer.canvas;

    const videoSource = new CanvasSource(canvasObj as any, {
      codec: format === "webm" ? "vp9" : "avc",
      bitrate: QUALITY_MAP[quality],
    });
    output.addVideoTrack(videoSource, { frameRate: fpsFloat });

    // 2. Setup Audio Source & native FilterGraph amix in the background if audio is requested
    let audioSource: AudioSampleSource | null = null;
    const audioClips = renderer.collectAudioClips(manifest);

    try {
      if (shouldIncludeAudio && audioClips.length > 0) {
        audioSource = new AudioSampleSource({
          codec: format === "webm" ? "opus" : "aac",
          bitrate: 192e3,
        });
        output.addAudioTrack(audioSource);
        await renderer.setupAudioMix(audioClips);
      }

      await output.start();

      // 3. Sequential non-realtime fast-forward rendering loop
      const totalDuration = renderer.calculateDuration(manifest);
      console.log(`[Exporter] Total timeline duration: ${totalDuration}s`);

      for (let t = 0; t < totalDuration; t += timeStep) {
        // Render the current timeline state onto the virtual canvas
        await renderer.render({ manifest, time: t });

        // CanvasSource captures the active canvas frame automatically
        await videoSource.add(t, timeStep);

        // Mix and push audio frames
        if (audioSource) {
          await renderer.pushAudioFrames(audioSource);
        }

        // Calculate and trigger progress callback
        if (onProgress && totalDuration > 0) {
          const percent = Math.min(Math.round((t / totalDuration) * 100), 99);
          onProgress(percent);
        }
      }

      if (onProgress) {
        onProgress(100);
      }

      // 4. Release active decoder resources and finalize container output file
      videoSource.close();
      await output.finalize();

      console.log(`[Exporter] Video export completed successfully: ${outputPath}`);
      return outputPath;
    } catch (err) {
      try {
        videoSource.close();
      } catch {}
      throw err;
    } finally {
      await renderer.dispose();
    }
  }


