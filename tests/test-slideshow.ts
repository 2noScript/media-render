import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const slideshowManifest: EditorManifest = await Bun.file(import.meta.dir + "/manifests/templates/slideshow-picsum-xyz.json").json();

async function test() {
  console.log("====================================================");
  console.log("RUNNING IMAGE SLIDESHOW RENDER TEST PIPELINE");
  console.log("====================================================");
  
  const renderService = new OpenCutRenderService();
  try {
    const startTime = Date.now();
    const resultPath = await renderService.renderProject(slideshowManifest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("====================================================");
    console.log(`🎉 SLIDESHOW TEST COMPLETED SUCCESSFULLY IN ${duration}s!`);
    console.log(`Video output saved at: ${resultPath}`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ SLIDESHOW TEST RENDER FAILED:", error);
    process.exit(1);
  }
}

test();
