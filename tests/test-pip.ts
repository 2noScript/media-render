import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";

registerMediabunnyServer();

const manifest: EditorManifest = await Bun.file(import.meta.dir + "/manifests/features/pip/test-pip.json").json();

async function test() {
  console.log("====================================================");
  console.log("RUNNING PICTURE-IN-PICTURE (PIP) RENDER TEST PIPELINE");
  console.log("====================================================");
  
  const renderService = new OpenCutRenderService();
  try {
    const startTime = Date.now();
    const resultPath = await renderService.renderProject(manifest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("====================================================");
    console.log(`🎉 PIP TEST COMPLETED SUCCESSFULLY IN ${duration}s!`);
    console.log(`Video output saved at: ${resultPath}`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ PIP TEST RENDER FAILED:", error);
    process.exit(1);
  }
}

test();
