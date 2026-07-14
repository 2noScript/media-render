import fs from "fs";
import path from "path";
import { GlobalFonts } from "@napi-rs/canvas";

const SYSTEM_FONTS = new Set([
	"Arial",
	"Helvetica",
	"Times New Roman",
	"Courier New",
	"Verdana",
	"Georgia",
	"monospace",
	"sans-serif",
	"serif",
]);

const FONT_CACHE_DIR = path.join(process.cwd(), "test-assets", "fonts");
const registered = new Set<string>();

function encodeFontFamily({ family }: { family: string }): string {
	return family.replace(/ /g, "+");
}

async function downloadGoogleFont({
	family,
	weight = 400,
}: {
	family: string;
	weight?: number;
}): Promise<string | null> {
	const url = `https://fonts.googleapis.com/css2?family=${encodeFontFamily({ family })}:wght@${weight}&display=swap`;
	const response = await fetch(url, {
		// Use a legacy User-Agent so Google returns .ttf URLs instead of woff2
		headers: {
			"User-Agent":
				"Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)",
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch CSS from Google Fonts: ${response.statusText}`);
	}
	const css = await response.text();

	// Extract the first font URL from the CSS
	const urlMatch = css.match(/url\(([^)]+)\)/i);
	if (!urlMatch) {
		throw new Error(`No font URL found in Google Fonts CSS for: ${family}`);
	}
	const fontUrl = urlMatch[1].replace(/['"]/g, "").trim();

	const fontResponse = await fetch(fontUrl);
	if (!fontResponse.ok) {
		throw new Error(`Failed to download font file: ${fontResponse.statusText}`);
	}

	if (!fs.existsSync(FONT_CACHE_DIR)) {
		fs.mkdirSync(FONT_CACHE_DIR, { recursive: true });
	}

	let ext = "ttf";
	const lastPart = fontUrl.split("?")[0].split(".").pop()?.toLowerCase();
	if (lastPart && ["ttf", "woff", "woff2", "otf"].includes(lastPart)) {
		ext = lastPart;
	}
	const destPath = path.join(FONT_CACHE_DIR, `${family}-${weight}.${ext}`);
	const fontBuffer = await fontResponse.arrayBuffer();
	fs.writeFileSync(destPath, Buffer.from(fontBuffer));

	return destPath;
}

export async function ensureFontLoaded({
	family,
}: {
	family: string;
}): Promise<void> {
	if (!family || SYSTEM_FONTS.has(family) || registered.has(family)) {
		return;
	}

	// Check on-disk cache first
	const weights = [400, 700];
	for (const weight of weights) {
		const candidates = [`${family}-${weight}.ttf`, `${family}-${weight}.woff`, `${family}-${weight}.woff2`];
		let foundPath: string | null = null;

		for (const candidate of candidates) {
			const p = path.join(FONT_CACHE_DIR, candidate);
			if (fs.existsSync(p)) {
				foundPath = p;
				break;
			}
		}

		if (!foundPath) {
			console.log(`📥 Downloading missing font: ${family} (weight ${weight})...`);
			try {
				foundPath = await downloadGoogleFont({ family, weight });
				if (foundPath) {
					console.log(`✅ Font downloaded: ${path.basename(foundPath)}`);
				}
			} catch (error) {
				console.warn(`⚠️ Failed to download font "${family}" weight ${weight}:`, error);
			}
		}

		if (foundPath) {
			GlobalFonts.registerFromPath(foundPath, family);
		}
	}

	registered.add(family);
}

export async function ensureSceneFontsLoaded({
	tracks,
}: {
	tracks: any;
}): Promise<void> {
	const families = new Set<string>();

	function collectFromElements(elements: any[] = []) {
		for (const el of elements) {
			if (el.type === "text" && el.params?.fontFamily) {
				families.add(el.params.fontFamily as string);
			}
		}
	}

	if (tracks?.main?.elements) collectFromElements(tracks.main.elements);
	if (Array.isArray(tracks?.overlay)) {
		for (const track of tracks.overlay) {
			collectFromElements(track.elements);
		}
	}

	await Promise.all(
		[...families].map((family) => ensureFontLoaded({ family })),
	);
}
