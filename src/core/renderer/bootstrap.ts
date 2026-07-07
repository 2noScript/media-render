import { Canvas, createCanvas } from "@napi-rs/canvas";
import * as NodeAv from "node-av";
import * as fs from "fs";

// Helper to check Docker env
const isDocker = (): boolean => {
  try {
    return fs.existsSync("/.dockerenv");
  } catch {
    return false;
  }
};

// Monkey patch NodeAv.HardwareContext.auto to return null inside Docker, forcing software fallback
const originalAuto = NodeAv.HardwareContext.auto;
NodeAv.HardwareContext.auto = function() {
  if (isDocker()) {
    return null;
  }
  return originalAuto.call(this);
};

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

// Monkey patch node-av findDecoderByName to block hardware codecs dynamically
const originalFindDecoderByName = NodeAv.Codec.findDecoderByName;
NodeAv.Codec.findDecoderByName = function(name: any) {
  if (name && (name.includes("rkmpp") || name.includes("nvdec"))) {
    return null;
  }
  return originalFindDecoderByName.call(this, name);
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

// Monkey patch node-av findEncoderByName to block hardware codecs dynamically
const originalFindEncoderByName = NodeAv.Codec.findEncoderByName;
NodeAv.Codec.findEncoderByName = function(name: any) {
  if (name && (name.includes("rkmpp") || name.includes("nvenc") || name.includes("qsv"))) {
    return null;
  }
  return originalFindEncoderByName.call(this, name);
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
