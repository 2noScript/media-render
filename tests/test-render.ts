import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const mockManifest: EditorManifest = await Bun.file(import.meta.dir + "/manifests/core/test-project-123.json").json();

async function test() {
  console.log("====================================================");
  console.log("RUNNING MOCK RENDER TEST PIPELINE");
  console.log("====================================================");
  
  const renderService = new OpenCutRenderService();
  try {
    const startTime = Date.now();
    const resultPath = await renderService.renderProject(mockManifest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("====================================================");
    console.log(`🎉 TEST COMPLETED SUCCESSFULLY IN ${duration}s!`);
    console.log(`Video output saved at: ${resultPath}`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ TEST RENDER FAILED:", error);
    process.exit(1);
  }
}

test();
