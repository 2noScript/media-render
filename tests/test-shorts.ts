import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const shortsManifest: EditorManifest = {
  id: "shorts-tiktok-abc",
  settings: {
    width: 360,
    height: 640, // Tỷ lệ dọc 9:16 chuẩn Shorts/TikTok
    fps: 30,
    format: "mp4",
    quality: "high"
  },
  tracks: [
    // 1. VIDEO TRACK CHÍNH (DỌC) - Đặt thời lượng 5 giây (Bằng với Bunny nguồn để scheduler chạy mượt)
    {
      id: "track-shorts-video",
      name: "Main Shorts Video",
      type: "video",
      isMain: true,
      muted: false,
      hidden: false,
      elements: [
        {
          id: "shorts-clip-1",
          name: "Vertical Content",
          type: "video",
          sourceUrl: "./test-assets/mov_bbb.mp4",
          duration: 5, 
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          width: 360,
          height: 640, 
          x: 0,
          y: 0,
          opacity: 1.0
        }
      ]
    },
    // 2. AUDIO TRACK (BGM CHO SHORTS) - Đặt thời lượng 4s (nhỏ hơn video 5s) giúp tránh lỗi lệch pha EOF
    {
      id: "track-shorts-audio",
      name: "Shorts BGM",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "shorts-bgm",
          name: "TikTok Trend Music",
          type: "audio",
          sourceUrl: "./test-assets/song.mp3",
          duration: 4,
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
  console.log("RUNNING SHORTS (9:16 VERTICAL) RENDER TEST PIPELINE");
  console.log("====================================================");
  
  const renderService = new OpenCutRenderService();
  try {
    const startTime = Date.now();
    const resultPath = await renderService.renderProject(shortsManifest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("====================================================");
    console.log(`🎉 SHORTS TEST COMPLETED SUCCESSFULLY IN ${duration}s!`);
    console.log(`Video output saved at: ${resultPath}`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ SHORTS TEST RENDER FAILED:", error);
    process.exit(1);
  }
}

test();
