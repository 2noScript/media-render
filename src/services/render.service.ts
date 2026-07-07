import { Manifest } from "../types/manifest";
import { exporter } from "../core/renderer/exporter";
import { validateManifest } from "../lib/manifest-validator";

export class OpenCutRenderService {
  /**
   * Wrapper method maintaining the legacy API interface for web controller compatibility.
   * Delegates export operations to SceneExporter to align with client-side composition.
   */
  public async renderProject(manifest: Manifest, onProgress?: (progress: number) => void, customOutputPath?: string): Promise<string> {
    // Validate manifest schema before proceeding with resource allocation and rendering
    const validationErrors = validateManifest(manifest);
    if (validationErrors.length > 0) {
      throw new Error(`[ManifestValidationError] Invalid manifest structure:\n- ${validationErrors.join("\n- ")}`);
    }

    const renderManifest: Manifest = {
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
