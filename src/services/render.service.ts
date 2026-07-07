import { EditorManifest } from "../types/editor-manifest";
import { SceneExporter } from "./renderer/scene-exporter";

export class OpenCutRenderService {
  /**
   * Phương thức wrapper giữ nguyên API cũ để tương thích với web controller
   * Ủy quyền xử lý export cho class SceneExporter đồng nhất với client
   */
  public async renderProject(manifest: EditorManifest): Promise<string> {
    const exporter = new SceneExporter({
      width: manifest.settings.width,
      height: manifest.settings.height,
      fps: manifest.settings.fps,
      format: manifest.settings.format,
      quality: "high",
      shouldIncludeAudio: true
    });
    
    return await exporter.export(manifest);
  }
}
