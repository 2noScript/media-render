import EventEmitter from "eventemitter3";
import {
	Output,
	Mp4OutputFormat,
	WebMOutputFormat,
	FilePathTarget,
	CanvasSource,
	AudioSampleSource,
	QUALITY_LOW,
	QUALITY_MEDIUM,
	QUALITY_HIGH,
	QUALITY_VERY_HIGH,
} from "mediabunny";
import type { RootNode } from "./nodes/root-node";
import { CanvasRenderer, FrameRate } from "./canvas-renderer";
import { SceneTracks } from "@/components/editor/panels/timeline/types";
import { AudioPipeline } from "../../core/renderer/audio-pipeline";

type ExportParams = {
	width: number;
	height: number;
	fps: FrameRate;
	format: "mp4" | "webm";
	quality: "low" | "medium" | "high" | "very_high";
	shouldIncludeAudio?: boolean;
	tracks?: SceneTracks;
};

const qualityMap = {
	low: QUALITY_LOW,
	medium: QUALITY_MEDIUM,
	high: QUALITY_HIGH,
	very_high: QUALITY_VERY_HIGH,
};

export type SceneExporterEvents = {
	progress: [progress: number];
	complete: [outputPath: string];
	error: [error: Error];
	cancelled: [];
};

export class SceneExporter extends EventEmitter<SceneExporterEvents> {
	private renderer: CanvasRenderer;
	private format: "mp4" | "webm";
	private quality: "low" | "medium" | "high" | "very_high";
	private shouldIncludeAudio: boolean;
	private tracks?: SceneTracks;
	private isCancelled = false;

	constructor({
		width,
		height,
		fps,
		format,
		quality,
		shouldIncludeAudio,
		tracks,
	}: ExportParams) {
		super();
		this.renderer = new CanvasRenderer({
			width,
			height,
			fps,
		});

		this.format = format;
		this.quality = quality;
		this.shouldIncludeAudio = shouldIncludeAudio ?? false;
		this.tracks = tracks;
	}

	cancel(): void {
		this.isCancelled = true;
	}

	async export({
		rootNode,
		outputPath,
	}: {
		rootNode: RootNode;
		outputPath: string;
	}): Promise<string | null> {
		const fps = this.renderer.fps;
		const fpsFloat = fps.numerator / fps.denominator;
		const timeStep = 1 / fpsFloat;
		const frameCount = Math.floor(rootNode.duration / timeStep);

		const outputFormat =
			this.format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat();

		const output = new Output({
			format: outputFormat,
			target: new FilePathTarget(outputPath),
		});

		const videoSource = new CanvasSource(this.renderer.getOutputCanvas() as any, {
			codec: this.format === "webm" ? "vp9" : "avc",
			bitrate: qualityMap[this.quality],
		});

		output.addVideoTrack(videoSource, { frameRate: fpsFloat });

		let audioSource: AudioSampleSource | null = null;
		let audioPipeline: AudioPipeline | null = null;

		if (this.shouldIncludeAudio && this.tracks) {
			audioPipeline = new AudioPipeline();
			const audioClips = audioPipeline.collectAudioClips(this.tracks);
			if (audioClips.length > 0) {
				audioSource = new AudioSampleSource({
					codec: this.format === "webm" ? "opus" : "aac",
					bitrate: 192000,
				});
				output.addAudioTrack(audioSource);
				await audioPipeline.setupAudioMix(audioClips);
			} else {
				audioPipeline = null;
			}
		}

		await output.start();

		for (let i = 0; i < frameCount; i++) {
			if (this.isCancelled) {
				await output.cancel();
				if (audioPipeline) {
					audioPipeline.dispose();
				}
				this.emit("cancelled");
				return null;
			}

			const timeSeconds = i * timeStep;
			await this.renderer.render({ node: rootNode, time: timeSeconds });
			await videoSource.add(timeSeconds, timeStep);

			if (audioSource && audioPipeline) {
				await audioPipeline.pushAudioFrames(audioSource);
			}

			this.emit("progress", i / frameCount);
		}

		if (this.isCancelled) {
			await output.cancel();
			if (audioPipeline) {
				audioPipeline.dispose();
			}
			this.emit("cancelled");
			return null;
		}

		videoSource.close();
		if (audioSource) {
			audioSource.close();
		}
		await output.finalize();

		if (audioPipeline) {
			audioPipeline.dispose();
		}

		this.emit("progress", 1);
		this.emit("complete", outputPath);
		return outputPath;
	}
}
