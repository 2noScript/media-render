import { GlobalFonts } from "@napi-rs/canvas";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export class RemoteFontLoader {
  private static cacheDir = path.resolve("./cache/fonts");

  /**
   * Downloads a font from a remote HTTP/HTTPS link and registers it with the @napi-rs/canvas runtime.
   * @param alias The font family name.
   * @param url The remote URL of the font file (.ttf, .otf).
   */
  public static async useRemote(alias: string, url: string): Promise<void> {
    // Generate MD5 hash from URL for unique file naming to avoid duplicate downloads
    const urlHash = crypto.createHash("md5").update(url).digest("hex");
    const extension = path.extname(new URL(url).pathname) || ".ttf";
    const localPath = path.join(this.cacheDir, `${urlHash}${extension}`);

    // Register immediately if already cached on disk
    if (fs.existsSync(localPath)) {
      try {
        GlobalFonts.registerFromPath(localPath, alias);
      } catch (err) {
        console.warn(`[FontLoader] Failed to register cached font [${alias}] from ${localPath}:`, err);
      }
      return;
    }

    // Download from remote if not cached
    try {
      console.log(`[FontLoader] Downloading remote font [${alias}] from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      
      // Ensure cache directory exists and write font file
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(buffer));

      // Register with @napi-rs/canvas
      GlobalFonts.registerFromPath(localPath, alias);
      console.log(`[FontLoader] Successfully downloaded and loaded remote font [${alias}] -> ${localPath}`);
    } catch (err) {
      console.error(`[FontLoader] Failed to load remote font [${alias}] from ${url}:`, err);
    }
  }
}
