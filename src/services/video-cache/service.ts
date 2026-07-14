import { Input, FilePathSource, ALL_FORMATS, VideoSampleSink } from "mediabunny";
import { Canvas, ImageData } from "@napi-rs/canvas";
import { createCanvasSurface } from "../renderer/canvas-utils";

export class VideoCache {
	private inputs = new Map<string, Input>();
	private sinks = new Map<string, VideoSampleSink>();
	private initPromises = new Map<string, Promise<void>>();

	async getFrameAt({
		mediaId,
		url,
		time,
	}: {
		mediaId: string;
		url: string;
		time: number;
	}): Promise<{ canvas: Canvas; width: number; height: number } | null> {
		await this.ensureSink({ mediaId, url });

		const sink = this.sinks.get(mediaId);
		if (!sink) return null;

		try {
			const sample = await sink.getSample(time);
			if (!sample) return null;

			const width = sample.displayWidth;
			const height = sample.displayHeight;

			const { canvas, context } = createCanvasSurface({ width, height });
			const rawBuffer = Buffer.alloc(width * height * 4);
			await sample.copyTo(rawBuffer, { format: "RGBA" } as any);
			const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
			const imageData = new ImageData(clamped, width, height);
			context.putImageData(imageData, 0, 0);
			sample.close();

			return { canvas, width, height };
		} catch (error) {
			console.error("Failed to decode video frame at time:", time, error);
			return null;
		}
	}

	private async ensureSink({
		mediaId,
		url,
	}: {
		mediaId: string;
		url: string;
	}): Promise<void> {
		if (this.sinks.has(mediaId)) return;

		const existingPromise = this.initPromises.get(mediaId);
		if (existingPromise) return existingPromise;

		const promise = (async () => {
			try {
				const source = new FilePathSource(url);
				const input = new Input({
					source,
					formats: ALL_FORMATS,
				});

				const videoTracks = await input.getVideoTracks();
				const videoTrack = videoTracks[0];
				if (!videoTrack) {
					throw new Error("No video track found in file");
				}

				const sink = new VideoSampleSink(videoTrack, {
					hardwareAcceleration: "no-preference",
				});

				this.inputs.set(mediaId, input);
				this.sinks.set(mediaId, sink);
			} catch (error) {
				this.initPromises.delete(mediaId);
				throw error;
			}
		})();

		this.initPromises.set(mediaId, promise);
		return promise;
	}

	async dispose() {
		for (const input of this.inputs.values()) {
			try {
				await input.dispose();
			} catch (error) {
				console.error("Dispose input failed:", error);
			}
		}
		this.inputs.clear();
		this.sinks.clear();
		this.initPromises.clear();
	}
}

export const videoCache = new VideoCache();
