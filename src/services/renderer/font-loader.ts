import { GlobalFonts } from "@napi-rs/canvas";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export class RemoteFontLoader {
  private static cacheDir = path.resolve("./cache/fonts");

  /**
   * Tải font chữ từ link remote HTTP/HTTPS và đăng ký vào @napi-rs/canvas runtime
   * @param alias Tên font chữ (fontFamily)
   * @param url Link remote tải font (.ttf, .otf, .woff, .woff2)
   */
  public static async useRemote(alias: string, url: string): Promise<void> {
    // Tạo hash MD5 từ URL để đặt tên file duy nhất tránh tải trùng lặp
    const urlHash = crypto.createHash("md5").update(url).digest("hex");
    const extension = path.extname(new URL(url).pathname) || ".ttf";
    const localPath = path.join(this.cacheDir, `${urlHash}${extension}`);

    // Nếu đã tải và lưu trong cache đĩa cứng, đăng ký ngay lập tức và bỏ qua tải lại
    if (fs.existsSync(localPath)) {
      try {
        GlobalFonts.registerFromPath(localPath, alias);
      } catch (err) {
        console.warn(`[FontLoader] Lỗi đăng ký font cache [${alias}] từ ${localPath}:`, err);
      }
      return;
    }

    // Nếu chưa có trong cache, tải từ remote
    try {
      console.log(`[FontLoader] Đang tải remote font [${alias}] từ: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      
      // Tạo thư mục cache và lưu file font
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(buffer));

      // Đăng ký với @napi-rs/canvas
      GlobalFonts.registerFromPath(localPath, alias);
      console.log(`[FontLoader] Tải và nạp thành công remote font [${alias}] -> ${localPath}`);
    } catch (err) {
      console.error(`[FontLoader] Không thể nạp remote font [${alias}] từ ${url}:`, err);
    }
  }
}
