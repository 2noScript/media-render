import { registerMediabunnyServer } from "./index";
import { RenderService } from "./index";
import { ResourceGuard } from "./services/resource.guard";
import { swaggerSpec, renderSwaggerUI } from "./docs";
import dotenv from "dotenv";
import fs from "fs";
import * as NodeAv from "node-av";

export function startServer(options?: { port?: number }) {
  dotenv.config();

  // Ensure the local test-outputs directory exists
  if (!fs.existsSync("./test-outputs")) {
    fs.mkdirSync("./test-outputs");
  }

  // Activate Mediabunny server-side polyfill (NodeAV wrapper)
  registerMediabunnyServer();

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

  const renderService = new RenderService();

  // In-memory registry to track active and recently finished rendering tasks progress
  const renderProgressMap = new Map<string, { 
    progress: number; 
    status: "rendering" | "completed" | "failed"; 
    videoPath?: string;
    error?: string; 
  }>();

  // Helper to schedule automatic progress task record cleanup after 5 minutes
  function scheduleTaskCleanup(id: string) {
    setTimeout(() => {
      renderProgressMap.delete(id);
    }, 5 * 60 * 1000);
  }

  // Configure concurrent rendering limit from environment variables
  const concurrentLimit = parseInt(process.env.CONCURRENT_RENDER_LIMIT || "2", 10);
  let activeRenders = 0;

  const port = options?.port ?? parseInt(process.env.PORT || "3005", 10);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // 1. GET /docs -> Swagger UI HTML Page
      if (method === "GET" && path === "/docs") {
        return new Response(renderSwaggerUI(), {
          headers: { "Content-Type": "text/html" }
        });
      }

      // 2. GET /docs/json -> Swagger Spec JSON schema
      if (method === "GET" && path === "/docs/json") {
        return new Response(JSON.stringify(swaggerSpec), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // 3. GET /render/:id/progress -> Task progress
      if (method === "GET" && path.startsWith("/render/") && path.endsWith("/progress")) {
        const match = path.match(/^\/render\/([^/]+)\/progress$/);
        if (match) {
          const id = match[1];
          const task = renderProgressMap.get(id);
          if (!task) {
            return new Response(JSON.stringify({
              success: false,
              message: "Render task not found or already expired",
            }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          return new Response(JSON.stringify({
            success: true,
            ...task
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      // 4. GET /health -> Health check & GPU acceleration detection
      if (method === "GET" && path === "/health") {
        const resourceStatus = ResourceGuard.check();
        const hwCaps = detectHardwareCapabilities();
        const payload = {
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
        
        const status = resourceStatus.isSafe ? 200 : 503;
        return new Response(JSON.stringify(payload), {
          status,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 5. POST /render -> Submit render job
      if (method === "POST" && path === "/render") {
        let body: any;
        try {
          body = await req.json();
        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            message: "Invalid JSON body",
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const manifestId = body.id || "unknown";
        const startTime = Date.now();

        // Guard resource limits
        const resourceStatus = ResourceGuard.check();
        if (!resourceStatus.isSafe) {
          console.warn(`[HTTP] [WARN] Rejected manifest ${manifestId} due to resource limits: ${resourceStatus.reason}`);
          return new Response(JSON.stringify({
            success: false,
            message: `Server resource limits reached: ${resourceStatus.reason}`,
            details: resourceStatus.details,
          }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Enforce concurrency limits
        if (activeRenders >= concurrentLimit) {
          console.warn(`[HTTP] [WARN] Rejected manifest ${manifestId}: Active renders (${activeRenders}) reached the limit of ${concurrentLimit}`);
          return new Response(JSON.stringify({
            success: false,
            message: `Server is busy. Concurrent render limit of ${concurrentLimit} reached. Please try again later.`,
          }), {
            status: 429,
            headers: { "Content-Type": "application/json" }
          });
        }

        activeRenders++;
        console.log(`[HTTP] [START] Active renders: ${activeRenders}/${concurrentLimit}. Executing render for manifest: ${manifestId}`);
        
        // Initialize progress entry
        renderProgressMap.set(manifestId, { progress: 0, status: "rendering" });

        try {
          const filePath = await renderService.renderManifest(body, (percent) => {
            renderProgressMap.set(manifestId, { progress: percent, status: "rendering" });
          });
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`[HTTP] [SUCCESS] Manifest ${manifestId} completed in ${duration}s. File size: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
          
          renderProgressMap.set(manifestId, { progress: 100, status: "completed", videoPath: filePath });
          scheduleTaskCleanup(manifestId);

          return new Response(JSON.stringify({
            success: true,
            message: "Render completed successfully!",
            videoPath: filePath,
            durationSeconds: parseFloat(duration),
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err: any) {
          console.error(`[HTTP] [ERROR] Render failed for manifest ${manifestId}:`, err);
          
          renderProgressMap.set(manifestId, { progress: 0, status: "failed", error: err.message || "Internal rendering error" });
          scheduleTaskCleanup(manifestId);

          return new Response(JSON.stringify({
            success: false,
            message: err.message || "Internal rendering error",
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        } finally {
          activeRenders--;
          console.log(`[HTTP] [END] Active renders remaining: ${activeRenders}/${concurrentLimit} (Finished manifest: ${manifestId})`);
        }
      }

      return new Response(JSON.stringify({
        success: false,
        message: "Not Found",
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
  });

  console.log(`HTTP Server is running at http://localhost:${port}`);
  console.log(`Swagger UI is available at http://localhost:${port}/docs`);
  console.log(`Media-render is running in stateless mode (Concurrent Limit: ${concurrentLimit}).`);

  const resourceStatus = ResourceGuard.check();
  console.log("====================================================");
  console.log("🖥️  SYSTEM STARTUP RESOURCE STATUS:");
  console.log(` - System Memory Usage : ${resourceStatus.details.systemMemoryUsagePercent}% (Max allowed: ${process.env.MAX_MEMORY_USAGE_PERCENT}%)`);
  console.log(` - Process RSS Memory  : ${resourceStatus.details.processMemoryMb} MB (Max allowed: ${process.env.MAX_PROCESS_MEMORY_MB} MB)`);
  console.log(` - CPU Cores / load    : ${resourceStatus.details.cpuCores} cores (Load 1-min avg: ${resourceStatus.details.loadAvg1Min}, Ratio: ${resourceStatus.details.cpuLoadRatio})`);

  const hwCaps = detectHardwareCapabilities();
  console.log("🎮 HARDWARE ACCELERATION DETECTION:");
  console.log(` - NVIDIA NVENC (GPU)  : ${hwCaps.nvidia_nvenc ? "🟢 AVAILABLE (h264_nvenc)" : "🔴 UNSUPPORTED"}`);
  console.log(` - Apple VideoToolbox  : ${hwCaps.apple_videotoolbox ? "🟢 AVAILABLE (h264_videotoolbox)" : "🔴 UNSUPPORTED"}`);
  console.log(` - Intel QuickSync     : ${hwCaps.intel_qsv ? "🟢 AVAILABLE (h264_qsv)" : "🔴 UNSUPPORTED"}`);
  console.log(` - HARDWARE_ACCELERATION: ${process.env.HARDWARE_ACCELERATION}`);
  console.log(` - SKIA_GPU: ${process.env.SKIA_GPU}`);
  console.log("====================================================");

  return server;
}

// Auto-run if executed directly
if (import.meta.main) {
  startServer();
}
