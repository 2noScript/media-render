import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { ProjectManifest } from "../src/types/opencut";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const slideshowManifest: ProjectManifest = {
  projectId: "slideshow-picsum-xyz",
  episodeId: "slideshow-episode-222",
  settings: {
    width: 640,
    height: 360,
    fps: 30,
    format: "mp4"
  },
  tracks: [
    // 1. MAIN VIDEO TRACK (CHỈ CHỨA ẢNH TĨNH XẾP NỐI TIẾP NHAU)
    {
      id: "track-main-slideshow",
      name: "Image Slideshow Track",
      type: "video",
      isMain: true,
      muted: false,
      hidden: false,
      elements: [
        {
          id: "slide-img-1",
          name: "Forest Scene",
          type: "image",
          sourceUrl: "https://picsum.photos/640/360?random=1",
          duration: 3,
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          width: 640,
          height: 360
        },
        {
          id: "slide-img-2",
          name: "Ocean Scene",
          type: "image",
          sourceUrl: "https://picsum.photos/640/360?random=2",
          duration: 3,
          startTime: 3,
          trimStart: 0,
          trimEnd: 0,
          width: 640,
          height: 360
        },
        {
          id: "slide-img-3",
          name: "Mountain Scene",
          type: "image",
          sourceUrl: "https://picsum.photos/640/360?random=3",
          duration: 3,
          startTime: 6,
          trimStart: 0,
          trimEnd: 0,
          width: 640,
          height: 360
        }
      ]
    },
    // 2. AUDIO TRACK (BGM CHO SLIDESHOW)
    {
      id: "track-slideshow-audio",
      name: "Background Music",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "bgm-slideshow",
          name: "Slide Background Sound",
          type: "audio",
          sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          duration: 9,
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          volume: 0.5
        }
      ]
    }
  ]
};

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
