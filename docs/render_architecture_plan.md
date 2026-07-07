# Kế Hoạch Thiết Kế: Bộ Dựng Hình Video Timeline Đồng Nhất (Isomorphic Timeline Renderer)

Bản thiết kế này mô tả chi tiết quy trình, sơ đồ trực quan và mã nguồn triển khai để di chuyển (migrate) lõi render video timeline từ client (`opencut-classic`) về server (`media-render`).

Mục tiêu cốt lõi là **giữ nguyên 100% chữ ký API (Class, Function, Parameters) giống client** để dễ dàng đối chiếu, đồng bộ, chỉ thay thế định nghĩa (internals) bên dưới cho phù hợp với môi trường Server (dùng `skia-canvas` thay cho browser Canvas/WebGL).

---

## 🎨 1. Sơ Đồ Trực Quan Hệ Thống (Visual Diagrams)

### A. Sơ Đồ So Sánh: Client Preview vs Server Render
Server loại bỏ hoàn toàn các bước trễ thời gian thực và DOM rendering của client để đạt hiệu năng tối đa:

```mermaid
graph TB
    classDef clientClass fill:#2b3a4a,stroke:#3498db,stroke-width:2px,color:#fff;
    classDef serverClass fill:#2c3e50,stroke:#e74c3c,stroke-width:2px,color:#fff;
    classDef sharedClass fill:#1e272e,stroke:#2ecc71,stroke-width:2px,color:#fff;

    subgraph Client ["【 CLIENT PREVIEW 】"]
        A1[Timeline Editor UI] --> A2(Preview Loop)
        A2 -->|Đợi đồng hồ hệ thống| A3(1/FPS Realtime Delay)
        A3 -->|Vẽ từng frame| A4[HTML5 Canvas DOM]
        A4 -->|Phát âm thanh| A5[Browser AudioContext]
    end

    subgraph Shared ["【 TRUNG GIAN - ĐỒNG NHẤT 】"]
        M1[Timeline JSON Manifest]
        M2[Mediabunny API]
    end

    subgraph Server ["【 SERVER EXPORT 】"]
        B1[Prefetch Assets] --> B2(Fast-Forward Loop)
        B2 -->|Chạy hết tốc lực CPU/GPU| B3(No Time Delay)
        B3 -->|Vẽ frame ảo| B4[Skia-Canvas 2D]
        B4 -->|CanvasSource tự động chụp| B5[CanvasSource]
        B6[NodeAV Audio Filter] -->|Mix PCM| B7[AudioSampleSource]
        B5 & B7 -->|Muxing| B8[Final Video Output]
    end

    M1 -.->|Khai báo cấu trúc vẽ| A1
    M1 -.->|Gửi lệnh Render| B1
    M2 -.->|Isomorphic API| A2
    M2 -.->|Isomorphic API| B2

    class A1,A2,A3,A4,A5 clientClass;
    class B1,B2,B3,B4,B5,B6,B7,B8 serverClass;
    class M1,M2 sharedClass;
```

---

### B. Sơ Đồ So Sánh Cấu Trúc Renderer (Client Renderer vs Server Renderer)
Sơ đồ dưới đây thể hiện sự đối chiếu chi tiết 1-1 về mặt công nghệ và cách xử lý vẽ giữa Client và Server:

```mermaid
graph TB
    classDef clientClass fill:#2b3a4a,stroke:#3498db,stroke-width:2px,color:#fff;
    classDef serverClass fill:#2c3e50,stroke:#e74c3c,stroke-width:2px,color:#fff;
    classDef sharedClass fill:#1e272e,stroke:#2ecc71,stroke-width:2px,color:#fff;

    subgraph ClientRenderer ["【 CLIENT - BROWSER RENDERER 】"]
        C1[OffscreenCanvas]
        C2[WebGL / WASM Compositing]
        C3[WebCodecs / HTMLVideoElement]
        C4[Browser Font Loading]
    end

    subgraph SharedRenderer ["【 THÀNH PHẦN CHUNG 】"]
        S1[W3C Canvas 2D standard Context]
        S2[CanvasSource API]
    end

    subgraph ServerRenderer ["【 SERVER - HEADLESS RENDERER 】"]
        R1[Skia-Canvas virtual Canvas]
        R2[Skia C++ 2D Hardware Draw]
        R3[VideoSampleSink Mediabunny]
        R4[RemoteFontLoader / Cache Disk]
    end

    %% Mối quan hệ đối chiếu tương đương
    C1 <-->|Vẽ ảo| R1
    C2 <-->|Xử lý đồ họa/Hiệu ứng| R2
    C3 <-->|Giải mã Video| R3
    C4 <-->|Nạp Font Chữ| R4

    %% Ánh xạ qua thành phần chung
    S1 -.->|API Vẽ chuẩn| C2
    S1 -.->|API Vẽ chuẩn| R2
    S2 -.->|Đóng gói Frame tự động| C1
    S2 -.->|Đóng gói Frame tự động| R1

    class C1,C2,C3,C4 clientClass;
    class R1,R2,R3,R4 serverClass;
    class S1,S2 sharedClass;
```

---

### C. Sơ Đồ Song Song: Đối Chiếu Luồng Vẽ Frame (Side-by-Side Drawing Pipelines)
Sơ đồ dưới đây thể hiện chi tiết sự tương thích 1-1 trong từng khâu giải quyết timeline và dựng hình:

```mermaid
graph LR
    %% Định dạng phong cách thiết kế
    classDef clientGroup fill:#1e272e,stroke:#3498db,stroke-width:2px,color:#fff;
    classDef serverGroup fill:#1e272e,stroke:#e74c3c,stroke-width:2px,color:#fff;
    classDef stepClass fill:#2c3e50,stroke:#7f8c8d,stroke-width:1px,color:#fff;

    subgraph ClientFlow ["【 LUỒNG RENDER CLIENT 】"]
        C_In[RootNode Ticks] --> C_Resolve[resolveRenderTree: tính transform]
        C_Resolve --> C_Buffer[buildFrameDescriptor: gom textures]
        C_Buffer -->|Textures WebGL| C_Wasm[wasmCompositor.render]
        C_Wasm -->|Draw| C_HTMLCanvas[Offscreen Canvas]
        C_HTMLCanvas -->|Tự động capture| C_MVideo[CanvasSource.add]
    end

    subgraph ServerFlow ["【 LUỒNG RENDER SERVER 】"]
        S_In[ProjectManifest Ticks] --> S_Loop[Duyệt tracks / active elements]
        S_Loop --> S_Video[renderVideoNodeToContext]
        S_Loop --> S_Image[renderImageNodeToContext]
        S_Loop --> S_Text[renderTextNodeToContext]
        S_Video & S_Image & S_Text -->|Draw| S_SkiaCanvas[Skia CanvasContext 2D]
        S_SkiaCanvas -->|Tự động capture| S_MVideo[CanvasSource.add]
    end

    %% Mối tương quan đồng nhất
    C_In <-->|Tương thích timeline| S_In
    C_Resolve <-->|Tương thích transform| S_Loop
    C_Wasm <-->|Tương thích GPU draw| S_SkiaCanvas
    C_MVideo <-->|Đồng nhất API Mediabunny| S_MVideo

    class C_In,C_Resolve,C_Buffer,C_Wasm,C_HTMLCanvas,C_MVideo stepClass;
    class S_In,S_Loop,S_Video,S_Image,S_Text,S_SkiaCanvas,S_MVideo stepClass;
    class ClientFlow clientGroup;
    class ServerFlow serverGroup;
```

---

### D. Sơ Đồ Tuần Tự (Sequence Diagram)
Mô tả quy trình xử lý timeline phi thời gian thực trên Server:

```mermaid
sequenceDiagram
    autonumber
    actor Client as NestJS / Test Script
    participant Server as Render Server (Bun)
    participant Disk as Local Disk (Cache)
    participant Canvas as Skia-Canvas (2D)
    participant MB as Mediabunny Output
    participant NodeAV as NodeAV Audio Mix

    Client->>Server: Gửi ProjectManifest (JSON)
    activate Server
    
    Note over Server,Disk: [Stage 1: Prefetch Assets]
    Server->>Disk: Tải và lưu cache tất cả video/ảnh/fonts
    Disk-->>Server: Trả về local file paths
    
    Note over Server,MB: [Stage 2: Setup Muxer]
    Server->>MB: Khởi tạo Output file (.mp4) & CanvasSource
    Server->>NodeAV: Khởi tạo amix Filter Graph cho các Audio Tracks
    
    Note over Server,Canvas: [Stage 3: Fast-Forward Rendering Loop]
    loop Từ t = 0 đến totalDuration (bước nhảy = 1/fps)
        Server->>Disk: Lấy khung hình tại thời điểm t
        Disk-->>Server: Video Frame (RGBA)
        Server->>Canvas: Vẽ Video Frame lên Canvas phụ
        Server->>Canvas: Vẽ Images & Subtitles (fillText, strokeText)
        Server->>MB: CanvasSource tự động chụp Canvas hiện tại
        
        Server->>NodeAV: Kéo mixed audio frame
        NodeAV-->>Server: AudioSample (PCM)
        Server->>MB: Ghi AudioSample vào Audio Track
    end
    
    Note over Server,MB: [Stage 4: Finalize & Close]
    Server->>MB: Gọi output.finalize() (Flush file ra disk)
    MB-->>Server: Tệp Video hoàn chỉnh thành công
    
    Server-->>Client: Trả về outputPath của file video
    deactivate Server
```

---

## 🔍 2. Phân Tích So Sánh Chi Tiết Lõi `Renderer` (Client vs Server)

Để đồng bộ 1-1, chúng ta ánh xạ trực tiếp cơ chế hoạt động của `CanvasRenderer` ở cả 2 môi trường:

```
                  ┌──────────────────────────────────────────┐
                  │    PHÂN TÍCH SO SÁNH PHẦN LÕI RENDERER   │
                  └──────────────────────────────────────────┘
                  
         【 CLIENT RENDERER 】                      【 SERVER RENDERER 】
 ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
 │ • HTMLCanvasElement               │      │ • Skia-Canvas Canvas (2D)         │
 │ • WebGL / WebAssembly Compositing │  vs  │ • Skia 2D Hardware Acceleration   │
 │ • HTMLVideoElement / Image Element│      │ • VideoSampleSink (Mediabunny)    │
 │ • measureText / 2D Canvas Text    │      │ • RemoteFontLoader (Tự động tải)  │
 └───────────────────────────────────┘      └───────────────────────────────────┘
```

### A. Đối Chiếu Các Khâu Xử Lý Vẽ Khung Hình

| Khâu Xử Lý | Client Renderer (`canvas-renderer.ts`) | Server Renderer (`canvas-renderer.ts`) |
| :--- | :--- | :--- |
| **Bản vẽ ảo** | Sử dụng `OffscreenCanvas` tích hợp của browser để làm bản vẽ phụ. | Sử dụng `Canvas` của thư viện `skia-canvas` làm bản vẽ ảo trong RAM. |
| **Độ Phân Giải** | Nhận `width`, `height` và thay đổi kích thước bằng thuộc tính `.width`, `.height` của canvas DOM. | Nhận `width`, `height` từ Settings và khởi tạo kích thước cố định bằng `new Canvas(width, height)`. |
| **Quy Trình Vẽ (Render Loop)** | 1. Gọi `resolveRenderTree` tính toán transform tại thời điểm `time`. <br>2. Gọi `buildFrameDescriptor` tạo textures WebGL. <br>3. `wasmCompositor.render` vẽ lên màn hình. | 1. Duyệt qua danh sách `manifest.tracks`. <br>2. Lọc các elements hoạt động tại thời điểm `time`. <br>3. Vẽ tuần tự các node lên context Skia Canvas. |
| **Lấy Khung hình Video** | Dùng thẻ `<video>` hoặc bộ giải mã WebCodecs để lấy texture WebGL của frame. | Dùng `VideoSampleSink.getSample(time)` của Mediabunny để decode frame C++ native. |
| **Vẽ Video lên Canvas** | Gọi `ctx.drawImage(videoElement)` hoặc dùng WebGL texture. | Dùng helper `drawVideoNodeToContext`: Copy pixel RGBA của `VideoSample` sang canvas phụ rồi `ctx.drawImage` lên canvas chính. |
| **Dựng Font Chữ** | Tự động load qua Google Fonts hoặc `@font-face` CSS bằng link remote. | Tự động download link remote font từ manifest và đăng ký bằng `FontLibrary.use()` qua `RemoteFontLoader`. |
| **Hiệu Ứng (Filter/Blend)** | Sử dụng WebGL Fragment Shaders (`wasmCompositor`). | Sử dụng các thuộc tính 2D chuẩn của Skia Canvas: `ctx.filter` (blur, contrast) và `ctx.globalCompositeOperation`. |

---

## 🗺 3. Cấu Trúc Thư Mục Porting (1-1 Folder Structure)

Chúng ta sẽ tái cấu trúc thư mục render trên Server đồng nhất với client:

```
media-render/src/
├── index.ts                      # Khởi chạy server & health checks
├── types/
│   └── opencut.ts                # Định nghĩa manifest, tracks, elements
└── services/
    └── renderer/                 # Thư mục lõi render (Porting từ client)
        ├── scene-exporter.ts     # Class SceneExporter điều phối export
        ├── canvas-renderer.ts    # Class CanvasRenderer vẽ frame
        ├── font-loader.ts        # Helper tải và nạp remote font chữ
        └── nodes/                # Các hàm vẽ từng loại layer
            ├── video-node.ts     # Vẽ khung hình Video
            ├── image-node.ts     # Vẽ Ảnh
            └── text-node.ts      # Vẽ Chữ Subtitles/Lyrics viền stroke
```

---

## 📐 4. Định Nghĩa Chi Tiết API & Class (Isomorphic Signatures)

### A. Tệp `scene-exporter.ts` (Class điều phối)
Lớp điều phối xuất video, giữ nguyên chữ ký API của client, sử dụng `CanvasSource` của Mediabunny kết nối trực tiếp với Skia Canvas.

```typescript
import { Output, Mp4OutputFormat, WebMOutputFormat, FilePathTarget, CanvasSource, AudioSampleSource, AudioSample } from "mediabunny";
import { CanvasRenderer } from "./canvas-renderer";
import { ProjectManifest } from "../../types/opencut";
import * as path from "path";

export type ExportParams = {
  width: number;
  height: number;
  fps: number;
  format: "mp4" | "webm";
  quality: "low" | "medium" | "high" | "very_high";
  shouldIncludeAudio?: boolean;
};

export class SceneExporter {
  private renderer: CanvasRenderer;
  private format: "mp4" | "webm";
  private quality: "low" | "medium" | "high" | "very_high";
  private shouldIncludeAudio: boolean;

  constructor({ width, height, fps, format, quality, shouldIncludeAudio }: ExportParams) {
    this.renderer = new CanvasRenderer({ width, height, fps });
    this.format = format;
    this.quality = quality;
    this.shouldIncludeAudio = shouldIncludeAudio ?? false;
  }

  public async export(manifest: ProjectManifest): Promise<string> {
    const outputDir = path.resolve("./test-outputs");
    const outputPath = path.join(outputDir, `output-${crypto.randomUUID()}.${this.format}`);
    const fpsFloat = manifest.settings.fps;
    const timeStep = 1 / fpsFloat;

    const output = new Output({
      format: this.format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target: new FilePathTarget(outputPath),
    });

    // Gắn trực tiếp skia-canvas vào CanvasSource
    const videoSource = new CanvasSource(this.renderer.canvas as any, {
      codec: this.format === "webm" ? "vp9" : "avc",
      bitrate: 4e6,
      hardwareAcceleration: (process.env.HARDWARE_ACCELERATION as any) || "no-preference",
    });
    output.addVideoTrack(videoSource);

    // Audio & Filter graph (amix) ở background
    let audioSource: AudioSampleSource | null = null;
    let complexFilter: any = null;
    let finalAudioLabel = "";
    const audioClips = this.renderer.collectAudioClips(manifest);

    if (this.shouldIncludeAudio && audioClips.length > 0) {
      audioSource = new AudioSampleSource({
        codec: this.format === "webm" ? "opus" : "aac",
        bitrate: 192e3,
      });
      output.addAudioTrack(audioSource);
      
      const audioSetup = await this.renderer.setupAudioMix(audioClips);
      complexFilter = audioSetup.filter;
      finalAudioLabel = audioSetup.label;
    }

    await output.start();

    // Vòng lặp render tuần tự
    const totalDuration = this.renderer.calculateDuration(manifest);

    for (let t = 0; t < totalDuration; t += timeStep) {
      // Dựng hình lên canvas ảo
      await this.renderer.render({ manifest, time: t });

      // CanvasSource tự động chụp frame hiện tại
      await videoSource.add(t, timeStep);

      // Trộn âm thanh native
      if (audioSource && complexFilter && finalAudioLabel) {
        await this.renderer.pushAudioFrames(audioSource, complexFilter, finalAudioLabel);
      }
    }

    videoSource.close();
    if (complexFilter) complexFilter.close();
    await output.finalize();
    await this.renderer.dispose();

    return outputPath;
  }
}
```

### B. Tệp `canvas-renderer.ts` (Bộ vẽ Canvas)
Lớp quản lý vòng đời Canvas, tải trước assets và remote fonts.

```typescript
import { Canvas, Image } from "skia-canvas";
import { Input, FilePathSource, ALL_FORMATS } from "mediabunny";
import { renderVideoNodeToContext } from "./nodes/video-node";
import { renderImageNodeToContext } from "./nodes/image-node";
import { renderTextNodeToContext } from "./nodes/text-node";
import { ProjectManifest } from "../../types/opencut";
import { RemoteFontLoader } from "./font-loader";
import * as av from "node-av";
import * as path from "path";

export class CanvasRenderer {
  public canvas: Canvas;
  public context: any;
  public width: number;
  public height: number;
  public fps: number;

  private inputsMap: Record<string, Input> = {};
  private videoSinksMap: Record<string, any> = {};
  private imagesMap: Record<string, Image> = {};
  private audioDemuxers: av.Demuxer[] = [];
  private audioDecodersMap: Record<string, av.Decoder> = {};

  constructor({ width, height, fps }: { width: number; height: number; fps: number }) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.canvas = new Canvas(width, height);
    this.context = this.canvas.getContext("2d");
  }

  public calculateDuration(manifest: ProjectManifest): number {
    const mainVideoTrack = manifest.tracks.find(t => t.type === "video" && (t as any).isMain);
    if (!mainVideoTrack) return 0;
    return mainVideoTrack.elements.reduce((acc, el) => acc + el.duration, 0);
  }

  public async render({ manifest, time }: { manifest: ProjectManifest; time: number }) {
    const ctx = this.context;
    
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);

    await this.ensureAssetsLoaded(manifest);

    // Dựng các nodes theo thứ tự tracks
    for (const track of manifest.tracks) {
      if (track.type === "video") {
        for (const el of track.elements) {
          if (time >= el.startTime && time < el.startTime + el.duration) {
            if (el.type === "video") {
              await renderVideoNodeToContext({ el: el as any, time, ctx, videoSinksMap: this.videoSinksMap });
            } else if (el.type === "image") {
              renderImageNodeToContext({ el: el as any, ctx, imagesMap: this.imagesMap });
            }
          }
        }
      } else if (track.type === "text") {
        for (const el of track.elements) {
          if (time >= el.startTime && time < el.startTime + el.duration) {
            renderTextNodeToContext({ el: el as any, ctx, canvasWidth: this.width, canvasHeight: this.height });
          }
        }
      }
    }
  }

  public collectAudioClips(manifest: ProjectManifest) {
    const clips: any[] = [];
    for (const track of manifest.tracks) {
      if (track.type === "audio") {
        clips.push(...track.elements);
      } else if (track.type === "video") {
        clips.push(...track.elements.filter(el => el.type === "video"));
      }
    }
    return clips;
  }

  public async setupAudioMix(clips: any[]) {
    const filterParts: string[] = [];
    const audioLabels: string[] = [];
    let audioInputIdx = 0;

    for (const clip of clips) {
      try {
        const demuxer = await av.Demuxer.open(clip.sourceUrl);
        const stream = demuxer.audio();
        if (stream) {
          this.audioDemuxers.push(demuxer);
          const key = `${audioInputIdx}:a`;
          this.audioDecodersMap[key] = await av.Decoder.create(stream);
          
          const delayMs = Math.round(clip.startTime * 1000);
          const label = `a_${clip.id}`;
          const vol = clip.volume !== undefined ? clip.volume : 1.0;

          filterParts.push(`[${audioInputIdx}:a]atrim=start=${clip.trimStart},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${vol}[${label}]`);
          audioLabels.push(`[${label}]`);
          audioInputIdx++;
        } else {
          demuxer[Symbol.dispose]();
        }
      } catch (err) {
        console.warn(`[CanvasRenderer] Skip audio for input ${clip.sourceUrl}:`, err);
      }
    }

    let finalAudioLabel = "";
    if (audioLabels.length > 1) {
      filterParts.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=shortest:normalize=0[a_final]`);
      finalAudioLabel = "a_final";
    } else if (audioLabels.length === 1) {
      filterParts.push(`${audioLabels[0]}anull[a_final]`);
      finalAudioLabel = "a_final";
    }
    
    const filterComplexString = filterParts.join("; ");
    const filterComplexInputConfigs = Object.keys(this.audioDecodersMap).map(label => ({ label }));
    const filterComplexOutputConfigs = [{ label: finalAudioLabel, mediaType: av.AVMEDIA_TYPE_AUDIO }];
    
    const filter = av.FilterComplexAPI.create(filterComplexString, {
      inputs: filterComplexInputConfigs,
      outputs: filterComplexOutputConfigs,
    });

    return { filter, label: finalAudioLabel };
  }

  public async pushAudioFrames(audioSource: any, complexFilter: any, finalAudioLabel: string) {
    while (true) {
      let audioFrame: av.Frame | null | undefined = null;
      try {
        audioFrame = await complexFilter.receive(finalAudioLabel);
      } catch {
        audioFrame = null;
      }
      if (!audioFrame) break;

      const { AudioSample } = await import("mediabunny");
      const { AvFrameAudioSampleResource } = await import("@mediabunny/server");
      const audioSample = new AudioSample(new AvFrameAudioSampleResource(audioFrame));
      await audioSource.add(audioSample);
      audioSample.close();
    }
  }

  private async ensureAssetsLoaded(manifest: ProjectManifest) {
    for (const track of manifest.tracks) {
      for (const el of track.elements) {
        if ("sourceUrl" in el && el.sourceUrl) {
          const key = el.id;
          if (el.type === "video" && !this.inputsMap[key]) {
            const input = new Input({ source: new FilePathSource(el.sourceUrl), formats: ALL_FORMATS });
            this.inputsMap[key] = input;
            const videoTracks = await input.getVideoTracks();
            const track = videoTracks[0];
            if (track) {
              const { VideoSampleSink } = await import("mediabunny");
              this.videoSinksMap[key] = new VideoSampleSink(track, {
                hardwareAcceleration: (process.env.HARDWARE_ACCELERATION as any) || "no-preference",
              });
            }
          } else if (el.type === "image" && !this.imagesMap[key]) {
            const img = new Image();
            img.src = el.sourceUrl.startsWith("http") ? el.sourceUrl : path.resolve(el.sourceUrl);
            await img.decode();
            this.imagesMap[key] = img;
          }
        }
        
        // Tải remote font nếu được chỉ định link remote trong TextElement style
        if (el.type === "text" && (el.style as any).fontUrl) {
          await RemoteFontLoader.useRemote(el.style.fontFamily, (el.style as any).fontUrl);
        }
      }
    }
  }

  public async dispose() {
    for (const d of this.audioDemuxers) {
      d[Symbol.dispose]();
    }
    for (const key in this.audioDecodersMap) {
      this.audioDecodersMap[key][Symbol.dispose]();
    }
    for (const key in this.inputsMap) {
      await this.inputsMap[key].dispose();
    }
  }
}
```

### C. Tệp `font-loader.ts` (Class tải và đăng ký Remote Font)
```typescript
import { FontLibrary } from "skia-canvas";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export class RemoteFontLoader {
  private static cacheDir = path.resolve("./cache/fonts");

  public static async useRemote(alias: string, url: string): Promise<void> {
    const urlHash = crypto.createHash("md5").update(url).digest("hex");
    const extension = path.extname(new URL(url).pathname) || ".ttf";
    const localPath = path.join(this.cacheDir, `${urlHash}${extension}`);

    if (fs.existsSync(localPath)) {
      FontLibrary.use(alias, localPath);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch font from ${url}`);
      
      const buffer = await response.arrayBuffer();
      
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(buffer));

      FontLibrary.use(alias, localPath);
      console.log(`[FontLoader] Tải và nạp thành công remote font [${alias}] từ: ${url}`);
    } catch (err) {
      console.error(`[FontLoader] Lỗi khi nạp remote font [${alias}]:`, err);
    }
  }
}
```
