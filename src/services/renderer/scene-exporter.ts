import { Canvas, createCanvas } from "@napi-rs/canvas";
import * as NodeAv from "node-av";

// Monkey patch node-av findDecoder to prevent MPP hardware decoder crashes on headless Linux environments (Docker)
const originalFindDecoder = NodeAv.Codec.findDecoder;
NodeAv.Codec.findDecoder = function(codecId: any) {
  const codec = originalFindDecoder.call(this, codecId);
  if (codec && codec.name && (codec.name.includes("rkmpp") || codec.name.includes("nvdec"))) {
    const swName = codec.name.includes("hevc") ? "hevc" : "h264";
    const swDecoder = NodeAv.Codec.findDecoderByName(swName as any);
    if (swDecoder) return swDecoder;
  }
  return codec;
};

// Monkey patch node-av findEncoder to prevent MPP/NVENC hardware encoder crashes on headless Linux environments (Docker)
const originalFindEncoder = NodeAv.Codec.findEncoder;
NodeAv.Codec.findEncoder = function(codecId: any) {
  const codec = originalFindEncoder.call(this, codecId);
  if (codec && codec.name && (codec.name.includes("rkmpp") || codec.name.includes("nvenc") || codec.name.includes("qsv"))) {
    const swName = codec.name.includes("hevc") ? "libx265" : "libx264";
    const swEncoder = NodeAv.Codec.findEncoderByName(swName as any);
    if (swEncoder) return swEncoder;
  }
  return codec;
};

// Polyfill global HTMLCanvasElement and OffscreenCanvas to bypass instance checks in mediabunny on server side (Bun)
(globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {
  static [Symbol.hasInstance](instance: any) {
    return instance && (instance instanceof Canvas || instance.constructor?.name === "Canvas");
  }
};

// Convert OffscreenCanvas to a FakeOffscreenCanvas (returning an instance of createCanvas)
class FakeOffscreenCanvas {
  constructor(width: number, height: number) {
    return createCanvas(width, height) as any;
  }
  static [Symbol.hasInstance](instance: any) {
    return instance && (instance instanceof Canvas || instance.constructor?.name === "Canvas");
  }
}
(globalThis as any).OffscreenCanvas = FakeOffscreenCanvas;

import { Output, Mp4OutputFormat, WebMOutputFormat, FilePathTarget, CanvasSource, AudioSampleSource, QUALITY_LOW, QUALITY_MEDIUM, QUALITY_HIGH, QUALITY_VERY_HIGH } from "mediabunny";
import { CanvasRenderer } from "./canvas-renderer";
import { EditorManifest } from "../../types/editor-manifest";
import * as path from "path";
import * as crypto from "crypto";

const qualityMap = {
  low: QUALITY_LOW,
  medium: QUALITY_MEDIUM,
  high: QUALITY_HIGH,
  very_high: QUALITY_VERY_HIGH,
};

// ExportParams represents the settings property of EditorManifest
export type ExportParams = EditorManifest["settings"];

export class SceneExporter {
  private renderer: CanvasRenderer;
  private format: "mp4" | "webm";
  private quality: "low" | "medium" | "high" | "very_high";
  private shouldIncludeAudio: boolean;

  constructor({ width, height, fps, format, quality, shouldIncludeAudio }: ExportParams) {
    this.renderer = new CanvasRenderer({ width, height, fps });
    this.format = format;
    this.quality = quality || "high";
    this.shouldIncludeAudio = shouldIncludeAudio ?? false;
  }

  /**
   * Exports the video timeline composition to a local file
   */
  public async export(manifest: EditorManifest): Promise<string> {
    const outputDir = path.resolve("./test-outputs");
    if (!fsExists(outputDir)) {
      await fsMkdir(outputDir);
    }
    const outputPath = path.join(outputDir, `output-${crypto.randomUUID()}.${this.format}`);
    const fpsFloat = manifest.settings.fps;
    const timeStep = 1 / fpsFloat;

    console.log(`[SceneExporter] Initiating video export (${this.quality}): ${manifest.id} -> ${outputPath}`);

    const output = new Output({
      format: this.format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target: new FilePathTarget(outputPath),
    });

    // 1. Direct bind of renderer virtual Canvas object to CanvasSource
    const canvasObj = this.renderer.canvas;

    const videoSource = new CanvasSource(canvasObj as any, {
      codec: this.format === "webm" ? "vp9" : "avc",
      bitrate: qualityMap[this.quality],
      hardwareAcceleration: (process.env.HARDWARE_ACCELERATION as any) || "no-preference",
    });
    output.addVideoTrack(videoSource, { frameRate: fpsFloat });

    // 2. Setup Audio Source & native FilterGraph amix in the background if audio is requested
    let audioSource: AudioSampleSource | null = null;
    const audioClips = this.renderer.collectAudioClips(manifest);

    if (this.shouldIncludeAudio && audioClips.length > 0) {
      audioSource = new AudioSampleSource({
        codec: this.format === "webm" ? "opus" : "aac",
        bitrate: 192e3,
      });
      output.addAudioTrack(audioSource);
      await this.renderer.setupAudioMix(audioClips);
    }

    await output.start();

    // 3. Sequential non-realtime fast-forward rendering loop
    const totalDuration = this.renderer.calculateDuration(manifest);
    console.log(`[SceneExporter] Total timeline duration: ${totalDuration}s`);

    for (let t = 0; t < totalDuration; t += timeStep) {
      // Render the current timeline state onto the virtual canvas
      await this.renderer.render({ manifest, time: t });

      // CanvasSource captures the active canvas frame automatically
      await videoSource.add(t, timeStep);

      // Mix and push audio frames
      if (audioSource) {
        await this.renderer.pushAudioFrames(audioSource);
      }
    }

    // 4. Release active decoder resources and finalize container output file
    videoSource.close();
    await output.finalize();
    await this.renderer.dispose();

    console.log(`[SceneExporter] Video export completed successfully: ${outputPath}`);
    return outputPath;
  }
}

// Helpers to avoid blocking sync fs imports
async function fsMkdir(p: string) {
  const fs = await import("fs");
  fs.mkdirSync(p, { recursive: true });
}

function fsExists(p: string): boolean {
  try {
    const fs = require("fs");
    return fs.existsSync(p);
  } catch {
    return false;
  }
}
