import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";

// Khởi chạy server-side polyfill của Mediabunny (NodeAV)
registerMediabunnyServer();

const lyricsManifest: EditorManifest = {
  id: "lyrics-karaoke-111",
  settings: {
    width: 640,
    height: 360,
    fps: 30,
    format: "mp4",
    quality: "high"
  },
  tracks: [
    // 1. MAIN TRACK (ẢNH TĨNH LÀM HÌNH NỀN) - Chạy suốt 10 giây
    {
      id: "track-main-bg",
      name: "Static Wallpaper Background",
      type: "video",
      isMain: true,
      muted: false,
      hidden: false,
      elements: [
        {
          id: "bg-image-1",
          name: "Karaoke Background Image",
          type: "image",
          sourceUrl: "https://picsum.photos/640/360?blur=2", // Ảnh làm mờ nhẹ làm nền
          duration: 10,
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          width: 640,
          height: 360,
          x: 0,
          y: 0,
          opacity: 1.0
        }
      ]
    },
    // 2. AUDIO TRACK (BÀI HÁT KÀRAOKE) - Chạy từ đầu đến cuối 10 giây
    {
      id: "track-main-audio",
      name: "Karaoke Audio Sound",
      type: "audio",
      muted: false,
      elements: [
        {
          id: "karaoke-song",
          name: "Vocal Audio Stream",
          type: "audio",
          sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          duration: 10,
          startTime: 0,
          trimStart: 5, // Trích từ giây thứ 5 của file nhạc gốc
          trimEnd: 0,
          volume: 0.8
        }
      ]
    },
    // 3. TEXT TRACK (CHỮ CHẠY THEO LỜI NHẠC) - Xuất hiện nối tiếp nhau
    {
      id: "track-lyrics-text",
      name: "Karaoke Subtitles",
      type: "text",
      hidden: false,
      elements: [
        {
          id: "lyric-line-1",
          name: "Lyric 1",
          type: "text",
          text: "Here is the first line of the song...",
          duration: 3,
          startTime: 0.5,
          trimStart: 0,
          trimEnd: 0,
          style: {
            fontSize: 24,
            color: "yellow",
            fontFamily: "Helvetica",
            x: 120,
            y: 300
          }
        },
        {
          id: "lyric-line-2",
          name: "Lyric 2",
          type: "text",
          text: "And now the second line appears!",
          duration: 3,
          startTime: 3.8,
          trimStart: 0,
          trimEnd: 0,
          style: {
            fontSize: 24,
            color: "cyan",
            fontFamily: "Helvetica",
            x: 130,
            y: 300
          }
        },
        {
          id: "lyric-line-3",
          name: "Lyric 3",
          type: "text",
          text: "Ending with a beautiful melody.",
          duration: 3,
          startTime: 7.0,
          trimStart: 0,
          trimEnd: 0,
          style: {
            fontSize: 24,
            color: "lightgreen",
            fontFamily: "Helvetica",
            x: 130,
            y: 300
          }
        }
      ]
    }
  ]
};

async function test() {
  console.log("====================================================");
  console.log("RUNNING LYRICS/KARAOKE VIDEO RENDER TEST PIPELINE");
  console.log("====================================================");
  
  const renderService = new OpenCutRenderService();
  try {
    const startTime = Date.now();
    const resultPath = await renderService.renderProject(lyricsManifest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("====================================================");
    console.log(`🎉 LYRICS TEST COMPLETED SUCCESSFULLY IN ${duration}s!`);
    console.log(`Video output saved at: ${resultPath}`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ LYRICS TEST RENDER FAILED:", error);
    process.exit(1);
  }
}

test();
