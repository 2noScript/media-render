import { EditorManifest } from "../src/types/editor-manifest";

const mockManifest: EditorManifest = await Bun.file(import.meta.dir + "/manifests/core/test-docker.json").json();

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
