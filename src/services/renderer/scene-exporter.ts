import { Canvas, createCanvas } from "@napi-rs/canvas";
import * as NodeAv from "node-av";

// Monkey patch node-av findDecoder để tránh lỗi MPP hardware decoder crash trên môi trường Linux headless (Docker)
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

// Monkey patch node-av findEncoder để tránh lỗi MPP/NVENC hardware encoder crash trên môi trường Linux headless (Docker)
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

// Polyfill global HTMLCanvasElement và OffscreenCanvas để lách instanceof check của mediabunny trên Server (Bun)
(globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {
  static [Symbol.hasInstance](instance: any) {
    return instance && (instance instanceof Canvas || instance.constructor?.name === "Canvas");
  }
};

// Biến OffscreenCanvas thành FakeOffscreenCanvas (trả về instance của createCanvas)
class FakeOffscreenCanvas {
  constructor(width: number, height: number) {
    return createCanvas(width, height) as any;
  }
  static [Symbol.hasInstance](instance: any) {
    return instance && (instance instanceof Canvas || instance.constructor?.name === "Canvas");
  }
}
(globalThis as any).OffscreenCanvas = FakeOffscreenCanvas;

import { Output, Mp4OutputFormat, WebMOutputFormat, FilePathTarget, CanvasSource, AudioSampleSource } from "mediabunny";
import { CanvasRenderer } from "./canvas-renderer";
import { ProjectManifest } from "../../types/opencut";
import * as path from "path";
import * as crypto from "crypto";

export type ExportParams = {
  width: number;
  height: number;
  fps: number;
  format: "mp4" | "webm";
  quality: "low" | "medium" | "high" | "very_high";
  shouldIncludeAudio?: boolean;
};

export class SceneExporter {
  private renderer: CanvasRenderer;
  private format: "mp4" | "webm";
  private quality: "low" | "medium" | "high" | "very_high";
  private shouldIncludeAudio: boolean;

  constructor({ width, height, fps, format, quality, shouldIncludeAudio }: ExportParams) {
    this.renderer = new CanvasRenderer({ width, height, fps });
    this.format = format;
    this.quality = quality;
    this.shouldIncludeAudio = shouldIncludeAudio ?? false;
  }

  /**
   * Thực hiện export timeline video ra file lưu trên đĩa cứng cục bộ
   */
  public async export(manifest: ProjectManifest): Promise<string> {
    const outputDir = path.resolve("./test-outputs");
    if (!fsExists(outputDir)) {
      await fsMkdir(outputDir);
    }
    const outputPath = path.join(outputDir, `output-${crypto.randomUUID()}.${this.format}`);
    const fpsFloat = manifest.settings.fps;
    const timeStep = 1 / fpsFloat;

    console.log(`[SceneExporter] Bắt đầu xuất video chất lượng ${this.quality}: ${manifest.projectId} -> ${outputPath}`);

    const output = new Output({
      format: this.format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target: new FilePathTarget(outputPath),
    });

    // 1. Gắn trực tiếp Canvas của Renderer vào CanvasSource
    const canvasObj = this.renderer.canvas;

    const videoSource = new CanvasSource(canvasObj as any, {
      codec: this.format === "webm" ? "vp9" : "avc",
      bitrate: 4e6,
      hardwareAcceleration: (process.env.HARDWARE_ACCELERATION as any) || "no-preference",
    });
    output.addVideoTrack(videoSource, { frameRate: fpsFloat });

    // 2. Cài đặt Audio Source & Filter graph (amix) ở background nếu được yêu cầu
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

    // 3. Vòng lặp render tuần tự phi thời gian thực (Fast-forward loop)
    const totalDuration = this.renderer.calculateDuration(manifest);
    console.log(`[SceneExporter] Tổng thời lượng timeline: ${totalDuration}s`);

    for (let t = 0; t < totalDuration; t += timeStep) {
      // Dựng hình timeline lên canvas ảo tại thời điểm t
      await this.renderer.render({ manifest, time: t });

      // CanvasSource tự động chụp frame hiện tại của canvas
      await videoSource.add(t, timeStep);

      // Trộn âm thanh và đẩy vào output
      if (audioSource) {
        await this.renderer.pushAudioFrames(audioSource);
      }
    }

    // 4. Giải phóng tài nguyên và đóng gói video
    videoSource.close();
    await output.finalize();
    await this.renderer.dispose();

    console.log(`[SceneExporter] Xuất video hoàn tất thành công: ${outputPath}`);
    return outputPath;
  }
}

// Helpers tránh import fs đồng bộ
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
