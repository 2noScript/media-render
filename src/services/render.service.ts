import { EditorManifest } from "../types/editor-manifest";
import { Exporter } from "../core/renderer/exporter";

export class OpenCutRenderService {
  /**
   * Wrapper method maintaining the legacy API interface for web controller compatibility.
   * Delegates export operations to SceneExporter to align with client-side composition.
   */
  public async renderProject(manifest: EditorManifest, onProgress?: (progress: number) => void): Promise<string> {
    const exporter = new Exporter({
      width: manifest.settings.width,
      height: manifest.settings.height,
      fps: manifest.settings.fps,
      format: manifest.settings.format,
      quality: "high",
      shouldIncludeAudio: true
    });
    
    return await exporter.export(manifest, onProgress);
  }
}
