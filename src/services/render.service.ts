import { EditorManifest } from "../types/editor-manifest";
import { exporter } from "../core/renderer/exporter";

export class OpenCutRenderService {
  /**
   * Wrapper method maintaining the legacy API interface for web controller compatibility.
   * Delegates export operations to SceneExporter to align with client-side composition.
   */
  public async renderProject(manifest: EditorManifest, onProgress?: (progress: number) => void, customOutputPath?: string): Promise<string> {
    const renderManifest: EditorManifest = {
      ...manifest,
      settings: {
        ...manifest.settings,
        quality: "high",
        shouldIncludeAudio: true
      }
    };
    
    return await exporter(renderManifest, onProgress, customOutputPath);
  }
}
