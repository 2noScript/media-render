import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "./services/render.service";
import { ResourceGuard } from "./services/resource.guard";
import { Elysia } from "elysia";
import { swaggerSpec, renderSwaggerUI } from "./docs";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Đảm bảo thư mục test-outputs tồn tại
if (!fs.existsSync("./test-outputs")) {
  fs.mkdirSync("./test-outputs");
}

// Kích hoạt Mediabunny server-side polyfill (NodeAV)
registerMediabunnyServer();

import * as NodeAv from "node-av";

function detectHardwareCapabilities() {
  const caps = {
    nvidia_nvenc: false,
    apple_videotoolbox: false,
    intel_qsv: false,
  };

  try {
    if (NodeAv.Codec.findEncoderByName("h264_nvenc" as any)) caps.nvidia_nvenc = true;
  } catch {}
  try {
    if (NodeAv.Codec.findEncoderByName("h264_videotoolbox" as any)) caps.apple_videotoolbox = true;
  } catch {}
  try {
    if (NodeAv.Codec.findEncoderByName("h264_qsv" as any)) caps.intel_qsv = true;
  } catch {}

  return caps;
}

const renderService = new OpenCutRenderService();

// Giới hạn số lượng render song song từ biến môi trường
const concurrentLimit = parseInt(process.env.CONCURRENT_RENDER_LIMIT || "2", 10);
let activeRenders = 0;

// ==========================================================
// ELYSIA WEB SERVER WITH CDN-BASED SWAGGER UI
// ==========================================================

export const app = new Elysia()
  // Swagger UI HTML Endpoint
  .get("/docs", () => {
    return new Response(renderSwaggerUI(), {
      headers: { "Content-Type": "text/html" }
    });
  })
  // Swagger spec JSON Endpoint
  .get("/docs/json", () => {
    return swaggerSpec;
  })
  // Endpoint Health Check chuyên dụng cho Docker / Kubernetes healthcheck
  .get("/health", ({ set }) => {
    const resourceStatus = ResourceGuard.check();
    if (!resourceStatus.isSafe) {
      set.status = 503; // Trả về 503 để báo container đang degraded
    }

    const hwCaps = detectHardwareCapabilities();

    return {
      status: resourceStatus.isSafe ? "healthy" : "degraded",
      reason: resourceStatus.reason,
      activeRenders,
      concurrentLimit,
      gpu: {
        detectedHardwareAcceleration: hwCaps,
        optimalVideoEncoder: hwCaps.nvidia_nvenc ? "h264_nvenc" : (hwCaps.apple_videotoolbox ? "h264_videotoolbox" : "libx264"),
        isGpuAccelerationActive: hwCaps.nvidia_nvenc || hwCaps.apple_videotoolbox
      },
      resources: resourceStatus.details,
      timestamp: new Date().toISOString(),
    };
  })
  // Endpoint thực thi render trực tiếp ngay khi nhận yêu cầu (có giới hạn song song và kiểm tra tài nguyên)
  .post(
    "/render",
    async ({ body, set }) => {
      const projectId = (body as any).projectId;
      const startTime = Date.now();

      // 1. Kiểm tra tài nguyên hệ thống (RAM, CPU, RSS) qua Resource Guard
      const resourceStatus = ResourceGuard.check();
      if (!resourceStatus.isSafe) {
        console.warn(`[HTTP] [WARN] Rejected project ${projectId} due to resource limits: ${resourceStatus.reason}`);
        set.status = 503; // Service Unavailable
        return {
          success: false,
          message: `Server resource limits reached: ${resourceStatus.reason}`,
          details: resourceStatus.details,
        };
      }

      // 2. Kiểm tra giới hạn số lượng render song song
      if (activeRenders >= concurrentLimit) {
        console.warn(`[HTTP] [WARN] Rejected project ${projectId}: Active renders (${activeRenders}) reached the limit of ${concurrentLimit}`);
        set.status = 429; // Too Many Requests
        return {
          success: false,
          message: `Server is busy. Concurrent render limit of ${concurrentLimit} reached. Please try again later.`,
        };
      }

      activeRenders++;
      console.log(`[HTTP] [START] Active renders: ${activeRenders}/${concurrentLimit}. Executing render for project: ${projectId}`);
      
      try {
        const filePath = await renderService.renderProject(body as any);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[HTTP] [SUCCESS] Project ${projectId} completed in ${duration}s. File size: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
        return {
          success: true,
          message: "Render completed successfully!",
          videoPath: filePath,
          durationSeconds: parseFloat(duration),
        };
      } catch (err: any) {
        console.error(`[HTTP] [ERROR] Render failed for project ${projectId}:`, err);
        set.status = 500;
        return {
          success: false,
          message: err.message || "Internal rendering error",
        };
      } finally {
        activeRenders--;
        console.log(`[HTTP] [END] Active renders remaining: ${activeRenders}/${concurrentLimit} (Finished project: ${projectId})`);
      }
    }
  )
  .listen(process.env.PORT || 3005);

async function main() {
  console.log(`HTTP Server is running at http://localhost:${process.env.PORT || 3005}`);
  console.log(`Swagger UI is available at http://localhost:${process.env.PORT || 3005}/docs`);
  console.log(`Media-render is running in stateless mode (Concurrent Limit: ${concurrentLimit}).`);
  
  // 1. Log tình trạng tài nguyên hệ thống khi khởi động
  const resourceStatus = ResourceGuard.check();
  console.log("====================================================");
  console.log("🖥️  SYSTEM STARTUP RESOURCE STATUS:");
  console.log(` - System Memory Usage : ${resourceStatus.details.systemMemoryUsagePercent}% (Max allowed: ${process.env.MAX_MEMORY_USAGE_PERCENT}%)`);
  console.log(` - Process RSS Memory  : ${resourceStatus.details.processMemoryMb} MB (Max allowed: ${process.env.MAX_PROCESS_MEMORY_MB} MB)`);
  console.log(` - CPU Cores / load    : ${resourceStatus.details.cpuCores} cores (Load 1-min avg: ${resourceStatus.details.loadAvg1Min}, Ratio: ${resourceStatus.details.cpuLoadRatio})`);
  
  // 2. Thăm dò và log năng lực xử lý phần cứng GPU / CPU
  const hwCaps = detectHardwareCapabilities();
  console.log("🎮 HARDWARE ACCELERATION DETECTION:");
  console.log(` - NVIDIA NVENC (GPU)  : ${hwCaps.nvidia_nvenc ? "🟢 AVAILABLE (h264_nvenc)" : "🔴 UNSUPPORTED"}`);
  console.log(` - Apple VideoToolbox  : ${hwCaps.apple_videotoolbox ? "🟢 AVAILABLE (h264_videotoolbox)" : "🔴 UNSUPPORTED"}`);
  console.log(` - Intel QuickSync     : ${hwCaps.intel_qsv ? "🟢 AVAILABLE (h264_qsv)" : "🔴 UNSUPPORTED"}`);
  console.log(` - HARDWARE_ACCELERATION: ${process.env.HARDWARE_ACCELERATION}`);
  console.log(` - SKIA_GPU: ${process.env.SKIA_GPU}`);
  console.log("====================================================");
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
