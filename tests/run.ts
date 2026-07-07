import { registerMediabunnyServer } from "@mediabunny/server";
import { OpenCutRenderService } from "../src/services/render.service";
import { EditorManifest } from "../src/types/editor-manifest";
import fs from "fs";
import path from "path";

import readline from "readline";

// Recursively find all JSON manifest files in a directory
function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...findJsonFiles(filePath));
    } else if (file.endsWith(".json")) {
      results.push(filePath);
    }
  }
  return results;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  const manifestsDir = path.join(import.meta.dir, "manifests");
  const allManifestFiles = findJsonFiles(manifestsDir);

  const args = process.argv.slice(2);
  const isDocker = args.includes("--docker") || args.includes("-d");
  const queryArgs = args.filter(a => a !== "--docker" && a !== "-d");
  const query = queryArgs[0]?.trim();

  let targetManifestPath: string;

  if (!query) {
    console.log("====================================================");
    console.log("📂 AVAILABLE TEST MANIFESTS:");
    console.log("====================================================");
    allManifestFiles.forEach((file, idx) => {
      const relPath = path.relative(manifestsDir, file);
      console.log(`  [${idx}] ${relPath}`);
    });
    console.log("====================================================");
    console.log("Usage: bun run test <manifest-name-or-path> [--docker]");
    console.log("Example: bun run test gaps");
    console.log("Example: bun run test core/test-render.json --docker");
    console.log("====================================================");

    const answer = await askQuestion(`Select manifest index (0-${allManifestFiles.length - 1}) to run: `);
    const selectedIdx = parseInt(answer.trim(), 10);
    if (!isNaN(selectedIdx) && selectedIdx >= 0 && selectedIdx < allManifestFiles.length) {
      targetManifestPath = allManifestFiles[selectedIdx];
    } else {
      console.log("No selection made. Exiting.");
      return;
    }
  } else {
    // Find matching manifest files
    const matches = allManifestFiles.filter(file => {
      const filename = path.basename(file).toLowerCase();
      const relPath = path.relative(manifestsDir, file).toLowerCase();
      const lowerQuery = query.toLowerCase();

      return (
        filename === lowerQuery ||
        filename === `${lowerQuery}.json` ||
        filename === `test-${lowerQuery}.json` ||
        relPath === lowerQuery ||
        relPath.includes(lowerQuery)
      );
    });

    if (matches.length === 0) {
      console.error(`❌ No manifest found matching query: "${query}"`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.log(`⚠️ Multiple manifests matched query "${query}":`);
      matches.forEach((m, idx) => {
        console.log(`  [${idx}] ${path.relative(manifestsDir, m)}`);
      });

      const answer = await askQuestion(`Select manifest index (0-${matches.length - 1}) [default 0]: `);
      const selectedIdx = parseInt(answer.trim(), 10);
      if (!isNaN(selectedIdx) && selectedIdx >= 0 && selectedIdx < matches.length) {
        targetManifestPath = matches[selectedIdx];
      } else {
        console.log("Invalid or no selection. Defaulting to index 0.");
        targetManifestPath = matches[0];
      }
    } else {
      targetManifestPath = matches[0];
    }
  }

  const manifestRelPath = path.relative(manifestsDir, targetManifestPath);
  console.log("====================================================");
  console.log(`📄 SELECTED MANIFEST: ${manifestRelPath}`);
  console.log(`📂 Path: ${targetManifestPath}`);
  console.log("====================================================");

  const manifest: EditorManifest = await Bun.file(targetManifestPath).json();

  const relManifestDir = path.dirname(manifestRelPath);
  const filenameWithoutExt = path.basename(manifestRelPath, ".json");
  const format = manifest.settings.format || "mp4";
  const customOutputPath = path.resolve("./test-outputs", relManifestDir, `${filenameWithoutExt}.${format}`);

  if (isDocker) {
    console.log(`🚀 [Docker Mode] Sending request to http://localhost:3005/render...`);
    try {
      const startTime = Date.now();
      const response = await fetch("http://localhost:3005/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      const result = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("====================================================");
      console.log(`HTTP Status: ${response.status}`);
      console.log("Response:", JSON.stringify(result, null, 2));
      console.log(`Total Docker request time: ${duration}s`);
      console.log("====================================================");
    } catch (error) {
      console.error("❌ Failed to connect to Docker container at http://localhost:3005", error);
      process.exit(1);
    }
  } else {
    console.log(`🚀 [Local Mode] Rendering video in-process...`);
    registerMediabunnyServer();
    const renderService = new OpenCutRenderService();

    try {
      const startTime = Date.now();
      const resultPath = await renderService.renderProject(manifest, undefined, customOutputPath);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("====================================================");
      console.log(`🎉 RENDER COMPLETED IN ${duration}s!`);
      console.log(`Video output saved at: ${resultPath}`);
      console.log("====================================================");
    } catch (error) {
      console.error("❌ Rendering failed:", error);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
