import { EditorManifest } from "../src/types/editor-manifest";

const mockManifest: EditorManifest = {
  id: "test-docker-project",
  settings: {
    width: 640,
    height: 360,
    fps: 30,
    format: "mp4",
    quality: "high"
  },
  tracks: [
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
        }
      ]
    },
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
          duration: 4,
          startTime: 0,
          trimStart: 0,
          trimEnd: 0,
          volume: 0.4
        }
      ]
    }
  ]
};

async function testDocker() {
  console.log("====================================================");
  console.log("SENDING RENDER REQUEST TO DOCKER CONTAINER (http://localhost:3005/render)");
  console.log("====================================================");

  try {
    const startTime = Date.now();
    const response = await fetch("http://localhost:3005/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mockManifest)
    });

    const result = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("====================================================");
    console.log("RESPONSE FROM DOCKER:");
    console.log(JSON.stringify(result, null, 2));
    console.log(`HTTP Status: ${response.status}`);
    console.log(`Total request time: ${duration}s`);
    console.log("====================================================");
  } catch (error) {
    console.error("❌ Failed to connect to Docker container at http://localhost:3005", error);
  }
}

testDocker();
