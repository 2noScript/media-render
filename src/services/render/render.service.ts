import { SceneExporter } from "../renderer/scene-exporter";
import { buildScene } from "../renderer/scene-builder";
import { calculateTotalDuration } from "../../components/editor/panels/timeline";
import type { SceneTracks } from "../../components/editor/panels/timeline/types";
import type { MediaAsset } from "../media/types";
import type { TBackground, TCanvasSize } from "../../core/project/types";
import fs from "fs";
import path from "path";

export interface RenderSceneParams {
	id?: string;
	tracks: SceneTracks;
	mediaAssets: MediaAsset[];
	canvasSize: TCanvasSize;
	background: TBackground;
	fps: number;
	format: "mp4" | "webm";
	quality: "low" | "medium" | "high" | "very_high";
	outputPath: string;
	onProgress?: (progress: number) => void;
}

export class RenderService {
	/**
	 * Main entry point matching the SceneExporter usage.
	 * Compiles and renders a scene defined by SceneTracks and MediaAssets.
	 */
	async renderScene(params: RenderSceneParams): Promise<string> {
		const {
			tracks,
			mediaAssets,
			canvasSize,
			background,
			fps,
			format,
			quality,
			outputPath,
			onProgress,
		} = params;

		const duration = calculateTotalDuration({ tracks });
		const scene = buildScene({
			canvasSize,
			tracks,
			mediaAssets,
			duration,
			background,
		});

		const exporter = new SceneExporter({
			width: canvasSize.width,
			height: canvasSize.height,
			fps: { numerator: fps, denominator: 1 },
			format,
			quality,
			shouldIncludeAudio: true,
			tracks,
		});

		if (onProgress) {
			exporter.on("progress", onProgress);
		}

		const outputDir = path.dirname(outputPath);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const result = await exporter.export({ rootNode: scene, outputPath });
		if (!result) {
			throw new Error("Export failed to produce file");
		}
		return result;
	}

	/**
	 * Legacy endpoint wrapper adapted for server routing compat.
	 * Maps incoming payload fields to renderScene parameters.
	 */
	async renderManifest(
		payload: any,
		onProgress?: (progress: number) => void,
		customOutputPath?: string,
	): Promise<string> {
		const id = payload.id || "render-task";
		const tracks = payload.tracks as SceneTracks;
		
		const mediaAssets: MediaAsset[] = payload.mediaAssets || [];
		if (mediaAssets.length === 0 && tracks) {
			const collectElements = (elements: any[]) => {
				for (const el of elements) {
					if ((el.type === "video" || el.type === "image" || el.type === "audio") && el.mediaId && (el.sourceUrl || el.url)) {
						if (!mediaAssets.some(asset => asset.id === el.mediaId)) {
							mediaAssets.push({
								id: el.mediaId,
								name: el.name || el.mediaId,
								type: el.type,
								url: el.sourceUrl || el.url,
							});
						}
					}
				}
			};
			if (tracks.main) collectElements(tracks.main.elements);
			if (tracks.overlay) {
				for (const track of tracks.overlay) {
					collectElements(track.elements);
				}
			}
			if (tracks.audio) {
				for (const track of tracks.audio) {
					collectElements(track.elements);
				}
			}
		}

		const canvasSize = payload.canvasSize || 
			(payload.settings?.width && payload.settings?.height 
				? { width: payload.settings.width, height: payload.settings.height } 
				: payload.settings?.canvasSize) || 
			{ width: 1920, height: 1080 };

		const background = payload.background || payload.settings?.background || { type: "color" as const, color: "transparent" };
		const fps = payload.fps || payload.settings?.fps || 30;
		const format = payload.format || payload.settings?.format || "mp4";
		const quality = payload.quality || payload.settings?.quality || "high";
		const outputPath = customOutputPath || `./test-outputs/${id}.${format}`;

		return this.renderScene({
			id,
			tracks,
			mediaAssets,
			canvasSize,
			background,
			fps,
			format,
			quality,
			outputPath,
			onProgress,
		});
	}
}
