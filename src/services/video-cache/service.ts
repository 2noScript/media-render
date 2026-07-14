import { Input, FilePathSource, ALL_FORMATS, VideoSampleSink } from "mediabunny";
import { Canvas, ImageData } from "@napi-rs/canvas";
import { createCanvasSurface } from "../renderer/canvas-utils";

interface ActiveDecoder {
	iterator: any;
	lastTime: number;
	lastSample: any;
	nextSample: any;
}

export class VideoCache {
	private inputs = new Map<string, Input>();
	private sinks = new Map<string, VideoSampleSink>();
	private initPromises = new Map<string, Promise<void>>();

	private canvasResources = new Map<string, {
		canvas: Canvas;
		context: any;
		rawBuffer: Buffer;
	}>();

	private activeDecoders = new Map<string, ActiveDecoder>();

	// Tick frame-level cache to share same-time frame decodes between multiple nodes (e.g. VideoNode & BlurBackgroundNode)
	private frameRenderCache = new Map<string, { canvas: Canvas; width: number; height: number } | null>();
	private lastRenderTime = -1;

	async getFrameAt({
		mediaId,
		file,
		time,
		clientId,
	}: {
		mediaId: string;
		file: any;
		time: number;
		clientId?: string;
	}): Promise<{ canvas: Canvas; width: number; height: number } | null> {
		const cacheKey = clientId || mediaId;
		// 1. Check frame-level render cache
		if (Math.abs(this.lastRenderTime - time) < 0.0001) {
			if (this.frameRenderCache.has(cacheKey)) {
				return this.frameRenderCache.get(cacheKey) ?? null;
			}
		} else {
			// Clear cache for new time tick
			this.frameRenderCache.clear();
			this.lastRenderTime = time;
		}

		const result = await this.decodeFrameAt({ mediaId, file, time, clientId });
		this.frameRenderCache.set(cacheKey, result);
		return result;
	}

	private async decodeFrameAt({
		mediaId,
		file,
		time,
		clientId,
	}: {
		mediaId: string;
		file: any;
		time: number;
		clientId?: string;
	}): Promise<{ canvas: Canvas; width: number; height: number } | null> {
		const url = file?.url || file?.name || String(file);
		await this.ensureSink({ mediaId, url });

		const sink = this.sinks.get(mediaId);
		if (!sink) return null;

		const decoderKey = clientId || mediaId;

		try {
			// 2. Manage active sequential decoder
			let active = this.activeDecoders.get(decoderKey);
			if (active) {
				// If seeking backwards, or jumping forward by a large margin (gap), reset decoder
				if (time < active.lastTime || time - active.lastTime > 2.0) {
					this.closeActiveDecoder(active);
					this.activeDecoders.delete(decoderKey);
					active = undefined;
				}
			}

			if (!active) {
				const iterator = sink.samples(time)[Symbol.asyncIterator]();
				active = {
					iterator,
					lastTime: time,
					lastSample: null,
					nextSample: undefined,
				};
				this.activeDecoders.set(decoderKey, active);
			}

			// 3. Pull from sequential iterator until we get the sample matching the timestamp
			let sample = active.lastSample;
			while (true) {
				if (active.nextSample === undefined) {
					const res = await active.iterator.next();
					active.nextSample = res.done ? null : res.value;
				}

				if (active.nextSample && active.nextSample.timestamp <= time) {
					if (sample) {
						sample.close();
					}
					sample = active.nextSample;
					active.lastSample = sample;
					active.lastTime = sample.timestamp;
					active.nextSample = undefined; // Consumed
					continue;
				}
				break;
			}

			// Fallback to getSample if iterator doesn't yield anything
			if (!sample) {
				sample = await sink.getSample(time);
			}
			if (!sample) return null;

			const width = sample.displayWidth;
			const height = sample.displayHeight;

			let resources = this.canvasResources.get(mediaId);
			if (!resources || resources.canvas.width !== width || resources.canvas.height !== height) {
				const { canvas, context } = createCanvasSurface({ width, height });
				const rawBuffer = Buffer.alloc(width * height * 4);
				resources = { canvas, context, rawBuffer };
				this.canvasResources.set(mediaId, resources);
			}

			const { canvas, context, rawBuffer } = resources;
			await sample.copyTo(rawBuffer, { format: "RGBA" } as any);
			const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
			const imageData = new ImageData(clamped, width, height);
			context.putImageData(imageData, 0, 0);

			// Note: If sample came from getSample (fallback), close it.
			// If it came from the iterator, do NOT close it yet because we might need it, or we close the previous one next loop.
			if (sample !== active.lastSample) {
				sample.close();
			}

			return { canvas, width, height };
		} catch (error) {
			console.error("Failed to decode video frame sequentially at time:", time, error);
			return null;
		}
	}

	private closeActiveDecoder(active: ActiveDecoder) {
		try {
			if (active.lastSample) {
				active.lastSample.close();
			}
			if (active.nextSample) {
				active.nextSample.close();
			}
			if (active.iterator.return) {
				active.iterator.return();
			}
		} catch (e) {
			// ignore cleanup errors
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
		// Clean up active decoders
		for (const active of this.activeDecoders.values()) {
			this.closeActiveDecoder(active);
		}
		this.activeDecoders.clear();
		this.frameRenderCache.clear();

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
