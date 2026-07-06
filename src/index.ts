import { registerMediabunnyServer } from "@mediabunny/server";
import { QueueService } from "./services/queue.service";
import { OpenCutRenderService } from "./services/render.service";
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

const renderService = new OpenCutRenderService();

// ==========================================================
// ELYSIA WEB SERVER WITH CDN-BASED SWAGGER UI
// ==========================================================

export const app = new Elysia()
  // Swagger UI HTML Endpoint (Tương tự docs của free-tts/workers)
  .get("/swagger", () => {
    return new Response(renderSwaggerUI(), {
      headers: { "Content-Type": "text/html" }
    });
  })
  // Swagger spec JSON Endpoint
  .get("/swagger/json", () => {
    return swaggerSpec;
  })
  // Endpoint thực thi render
  .post("/render", async ({ body }) => {
    console.log(`[HTTP] Received render request for project: ${(body as any).projectId}`);
    const filePath = await renderService.renderProject(body as any);
    return {
      success: true,
      message: "Render completed successfully!",
      videoPath: filePath,
    };
  })
  .listen(process.env.PORT || 3005);

async function main() {
  console.log(`HTTP Server is running at http://localhost:${process.env.PORT || 3005}`);
  console.log(`Swagger UI is available at http://localhost:${process.env.PORT || 3005}/swagger`);

  // Khởi chạy RabbitMQ listener song song
  try {
    const queueService = new QueueService();
    await queueService.connect();
    console.log("RabbitMQ Listener is active and waiting for tasks!");
  } catch (err) {
    console.warn("Could not connect to RabbitMQ, queue service disabled. Error:", err);
  }
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
