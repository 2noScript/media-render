import fs from "fs";
import path from "path";

const assetsDir = path.join(import.meta.dir, "..", "test-assets");

const assets = [
	{
		name: "mov_bbb.mp4",
		url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
	},
	{
		name: "song.mp3",
		url: "https://www.w3schools.com/html/horse.mp3",
	},
];

export async function ensureTestAssets(): Promise<void> {
	if (!fs.existsSync(assetsDir)) {
		fs.mkdirSync(assetsDir, { recursive: true });
	}

	for (const asset of assets) {
		const dest = path.join(assetsDir, asset.name);
		if (!fs.existsSync(dest)) {
			console.log(`📥 Downloading missing test asset: ${asset.name}...`);
			try {
				const response = await fetch(asset.url);
				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.statusText}`);
				}
				const arrayBuffer = await response.arrayBuffer();
				fs.writeFileSync(dest, Buffer.from(arrayBuffer));
				console.log(`✅ Successfully downloaded and saved ${asset.name}`);
			} catch (error) {
				console.error(`❌ Failed to download asset ${asset.name}:`, error);
				throw error;
			}
		}
	}
}
