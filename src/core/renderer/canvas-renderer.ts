import { Canvas } from "@napi-rs/canvas";
import { nodeRegistry, RootNode, BlurBackgroundNode } from "./nodes";
import { createCanvasSurface } from "./canvas-utils";
import { EditorManifest } from "../../types/editor-manifest";
import { skiaCompositor } from "./compositor/skia-compositor";
import { AssetRegistry } from "./asset-registry";
import { AudioPipeline } from "./audio-pipeline";

export class CanvasRenderer {
  public canvas: Canvas;
  public context: any;
  public width: number;
  public height: number;
  public fps: number;

  /** Manages image preloading, remote font loading, and video demuxer caches */
  public assetRegistry = new AssetRegistry();
  /** Handles NodeAV Filter Complex multi-track audio mixing and streaming */
  public audioPipeline = new AudioPipeline();

  // Root node representing the top of the scene graph tree
  private rootNode!: RootNode;

  constructor({ width, height, fps }: { width: number; height: number; fps: number }) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    const { canvas, context } = createCanvasSurface({ width, height });
    this.canvas = canvas;
    this.context = context;
  }

  /**
   * Caches raw image and sticker objects
   */
  public get imagesMap() {
    return this.assetRegistry.imagesMap;
  }

  /**
   * Caches decoded video sinks for frame retrieval
   */
  public get videoSinksMap() {
    return this.assetRegistry.videoSinksMap;
  }

  /**
   * Calculates total timeline duration based on the primary main video track elements.
   * Uses the maximum end time (startTime + duration) of all elements on the main track to handle gaps correctly.
   * @param manifest The EditorManifest containing timeline tracks
   * @returns Total duration in seconds
   */
  public calculateDuration(manifest: EditorManifest): number {
    let maxEnd = 0;
    for (const track of manifest.tracks) {
      for (const el of track.elements) {
        const elEnd = el.startTime + el.duration;
        if (elEnd > maxEnd) {
          maxEnd = elEnd;
        }
      }
    }
    return maxEnd;
  }

  /**
   * Renders the timeline state onto the virtual canvas context at a specific timestamp
   * @param manifest The EditorManifest containing timeline tracks
   * @param time The local timeline timestamp in seconds
   */
  public async render({ manifest, time }: { manifest: EditorManifest; time: number }): Promise<void> {
    const ctx = this.context;

    // Asynchronously pre-fetch all required images, fonts, and video sinks
    await this.assetRegistry.ensureAssetsLoaded(manifest);

    // Rebuild the visual Scene Graph hierarchy
    this.buildSceneGraph(manifest);

    // Build the Frame Descriptor and gather active textures recursively
    const { items, textures } = await this.rootNode.buildFrame(time, this, "root");

    const frameDescriptor = {
      width: this.width,
      height: this.height,
      clear: {
        color: [0, 0, 0, 1] as [number, number, number, number],
      },
      items,
    };

    // Synchronize the offscreen compositor textures cache
    skiaCompositor.syncTextures(textures);

    // Composite and render the layers onto the target canvas
    skiaCompositor.render(frameDescriptor, ctx);
  }

  /**
   * Compiles the manifest timeline tracks into the scene graph of Node instances
   * @param manifest The EditorManifest containing timeline tracks
   */
  private buildSceneGraph(manifest: EditorManifest): void {
    const duration = this.calculateDuration(manifest);
    this.rootNode = new RootNode({ duration });

    // 1. Partition tracks: separate main video track from overlays, ignoring audio tracks
    const mainTrack = manifest.tracks.find(
      (t) => t.type === "video" && (t as any).isMain && !(t as any).hidden
    );
    const overlayTracks = manifest.tracks.filter(
      (t) => t.type !== "audio" && !(t as any).hidden && !(t.type === "video" && (t as any).isMain)
    );

    // 2. Pass 1: Build and add BlurBackgroundNode instances from the main track first (absolute bottom layer)
    if (mainTrack) {
      const sortedMainElements = [...mainTrack.elements].sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime - b.startTime;
        return a.id.localeCompare(b.id);
      });

      for (const el of sortedMainElements) {
        if ((el.type === "video" || el.type === "image") && (el as any).blurIntensity !== undefined) {
          this.rootNode.add(
            new BlurBackgroundNode(
              el as any,
              this.videoSinksMap,
              this.imagesMap,
              this.width,
              this.height
            )
          );
        }
      }
    }

    // 3. Sort tracks bottom to top: main video track first, then overlay tracks in reverse order
    const orderedTracks = [
      ...(mainTrack ? [mainTrack] : []),
      ...[...overlayTracks].reverse(),
    ];

    // 4. Pass 2: Add all primary visual elements
    for (const track of orderedTracks) {
      // Sort elements within each track by startTime, falling back to ID alphabetically
      const sortedElements = [...track.elements].sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime - b.startTime;
        return a.id.localeCompare(b.id);
      });

      for (const el of sortedElements) {
        // Resolve the Node registry mapping dynamically
        const node = nodeRegistry.create(el.type, el, this);
        if (node) {
          this.rootNode.add(node);
        }
      }
    }
  }

  /**
   * Helper to collect all timeline elements containing active audio streams
   */
  public collectAudioClips(manifest: EditorManifest): any[] {
    return this.audioPipeline.collectAudioClips(manifest);
  }

  /**
   * Sets up NodeAV native FilterGraph (amix) for multi-track audio mixing
   */
  public async setupAudioMix(clips: any[]): Promise<void> {
    await this.audioPipeline.setupAudioMix(clips);
  }

  /**
   * Pulls mixed audio frames from the generator and feeds them to the output stream
   */
  public async pushAudioFrames(audioSource: any): Promise<void> {
    await this.audioPipeline.pushAudioFrames(audioSource);
  }

  /**
   * Releases input registries and audio demuxer/decoder resources
   */
  public async dispose(): Promise<void> {
    await this.assetRegistry.dispose();
    this.audioPipeline.dispose();
  }
}
