import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { ProjectManifest } from "../src/types/opencut";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const mockManifest: ProjectManifest = {
  projectId: "test-project-123",
  episodeId: "test-episode-456",
  settings: {
    width: 640,
    height: 360,
    fps: 30,
    format: "mp4"
  },
  tracks: [
    // 1. VIDEO TRACK CHÍNH (NỀN) - Có 2 clip và 1 khoảng trống (gap) ở giữa
    {
      id: "track-main-video",
      name: "Main Video Track",
      type: "video",
      isMain: true,
      muted: false,
      hidden: false,
      elements: [
        {
          id: "main-clip-1",
          name: "Bunny Part 1",
          type: "video",
          sourceUrl: "./test-assets/mov_bbb.mp4",
          duration: 5,
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          width: 640,
          height: 360,
          x: 0,
          y: 0,
          opacity: 1.0
        },
        // GAP: từ giây thứ 5 đến giây thứ 8 (khoảng trống 3 giây)
        {
          id: "main-clip-2",
          name: "Bunny Part 2",
          type: "video",
          sourceUrl: "./test-assets/mov_bbb.mp4",
          duration: 5,
          startTime: 8,
          trimStart: 2, // Cắt bỏ 2 giây đầu tiên của file nguồn
          trimEnd: 0,
          volume: 1.0,
          width: 640,
          height: 360,
          x: 0,
          y: 0,
          opacity: 1.0
        }
      ]
    },
    // 2. VIDEO OVERLAY TRACK - Đè một logo/ảnh lên góc màn hình từ giây thứ 2 đến giây thứ 7
    {
      id: "track-overlay-image",
      name: "Watermark Overlay",
      type: "video",
      isMain: false,
      muted: false,
      hidden: false,
      elements: [
        {
          id: "overlay-image-1",
          name: "Watermark Image",
          type: "image",
          sourceUrl: "https://picsum.photos/100/100", // Tải ảnh mockup từ Lorem Picsum
          duration: 5,
          startTime: 2,
          trimStart: 0,
          trimEnd: 0,
          width: 100,
          height: 100,
          x: 40,
          y: 40,
          opacity: 0.8
        }
      ]
    },
    // 3. TEXT TRACK (SUBTITLE) - Hiện chữ "Hello OpenCut!" từ giây thứ 1 đến giây thứ 4
    {
      id: "track-subtitle",
      name: "Subtitles",
      type: "text",
      elements: [
        {
          id: "sub-1",
          name: "Sub 1",
          type: "text",
          text: "Hello OpenCut!",
          duration: 3,
          startTime: 1,
          trimStart: 0,
          trimEnd: 0,
          style: {
            fontSize: 24,
            color: "yellow",
            fontFamily: "Arial",
            x: 220,
            y: 280
          }
        }
      ],
      hidden: false
    },
    // 4. AUDIO TRACK (BGM) - Phát nhạc nền song song, trì hoãn 2 giây, âm lượng 0.4
    {
      id: "track-bgm",
      name: "Background Music",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "bgm-1",
          name: "Theme Music",
          type: "audio",
          sourceUrl: "./test-assets/song.mp3",
          duration: 10,
          startTime: 2,
          trimStart: 0,
          trimEnd: 0,
          volume: 0.4
        }
      ]
    }
  ]
};

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
