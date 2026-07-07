import { loadImage, Image } from "@napi-rs/canvas";
import { Input, FilePathSource, ALL_FORMATS, VideoSampleSink } from "mediabunny";
import { EditorManifest } from "../../types/editor-manifest";
import { RemoteFontLoader } from "./font-loader";
import * as path from "path";

export class AssetRegistry {
  /** Caches input file readers for media resources */
  public inputsMap: Record<string, Input> = {};
  /** Caches VideoSampleSink decoders for raw video frame retrieval */
  public videoSinksMap: Record<string, any> = {};
  /** Caches loaded image and sticker assets */
  public imagesMap: Record<string, Image> = {};
  /** Tracks loaded or attempted font URLs in this session */
  private loadedFonts = new Set<string>();

  /**
   * Assures all required image, video decoder sinks, and remote fonts are loaded
   * @param manifest The EditorManifest containing timeline tracks
   */
  public async ensureAssetsLoaded(manifest: EditorManifest): Promise<void> {
    for (const track of manifest.tracks) {
      for (const el of track.elements as any[]) {
        // Load video sink decoders if they do not exist
        if (el.type === "video" && !this.inputsMap[el.id]) {
          const sourceUrl = el.sourceUrl;
          if (sourceUrl) {
            const input = new Input({ source: new FilePathSource(sourceUrl), formats: ALL_FORMATS });
            this.inputsMap[el.id] = input;
            const videoTracks = await input.getVideoTracks();
            const track = videoTracks[0];
            if (track) {
              this.videoSinksMap[el.id] = new VideoSampleSink(track, {
                hardwareAcceleration: "no-preference",
              });
            }
          }
        } 
        // Load static image or sticker graphics
        else if ((el.type === "image" || el.type === "sticker") && !this.imagesMap[el.id]) {
          const sourceUrl = el.sourceUrl || el.stickerUrl || el.url;
          if (sourceUrl) {
            const src = sourceUrl.startsWith("http") ? sourceUrl : path.resolve(sourceUrl);
            const img = await loadImage(src);
            this.imagesMap[el.id] = img;
            if (el.stickerId) {
              this.imagesMap[el.stickerId] = img;
            }
          }
        }

        // Load and register remote custom fonts
        if (el.type === "text") {
          const fontFamily = el.style?.fontFamily ?? el.params?.["fontFamily"];
          const fontUrl = el.style?.fontUrl ?? el.params?.["fontUrl"];
          if (fontFamily && fontUrl) {
            const fontKey = `${fontFamily}:${fontUrl}`;
            if (!this.loadedFonts.has(fontKey)) {
              this.loadedFonts.add(fontKey);
              await RemoteFontLoader.useRemote(fontFamily, fontUrl);
            }
          }
        }
      }
    }
  }

  /**
   * Releases all input media readers and decoder resources
   */
  public async dispose(): Promise<void> {
    for (const key in this.inputsMap) {
      try {
        await this.inputsMap[key].dispose();
      } catch {}
    }
  }
}
