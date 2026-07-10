# Hệ thống Chuyển cảnh & Kiến trúc Plugin (Transition System)

Tài liệu này mô tả thiết kế, hiện thực và cách mở rộng hệ thống dựng hình chuyển cảnh (transition rendering system) trong `media-render`.

---

## 🗺️ 1. Tổng quan Kiến trúc

Các hiệu ứng chuyển cảnh trong OpenCut hoạt động dựa trên cơ chế đăng ký (registry-driven), tách biệt hoàn toàn logic hiệu ứng hình ảnh khỏi bộ điều phối dòng thời gian chính.

```
+--------------------------------------------------------------------------+
|                            CanvasRenderer                                |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
|                         TransitionNode (resolve)                         |
|  - Xác định clip ra 'fromNode' (outgoing) & clip vào 'toNode' (incoming) |
|  - Tính toán tiến trình transition (0.0 -> 1.0) và áp dụng đường cong    |
|  - Kích hoạt giải mã sớm khung hình của 'toNode' (vì clip này chưa tới    |
|    thời điểm bắt đầu thực tế trên timeline chính)                        |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
|                         TransitionNode (render)                          |
|  - Vẽ clip cũ ra bề mặt offscreen canvas tạm thời 'fromCanvas'           |
|  - Vẽ clip mới ra bề mặt offscreen canvas tạm thời 'toCanvas'            |
|  - Gọi hàm xử lý render hiệu ứng đăng ký trong Registry trên context đầu ra|
|  - Trả về canvas đầu ra như một lớp tổng hợp duy nhất cho compositor      |
+--------------------------------------------------------------------------+
```

---

## ⚙️ 2. Định nghĩa Kiểu dữ liệu Core

Hệ thống được định nghĩa tại `media-render/src/transitions/types.ts`:

### `TransitionDefinition`
Định nghĩa metadata của transition, các tham số cấu hình và bộ dựng hình:
```typescript
export interface TransitionDefinition {
  type: string;             // Khóa đăng ký (phải khớp với TransitionElement.transitionType)
  name: string;             // Tên hiển thị thân thiện trên UI
  group: string;            // Phân nhóm hiệu ứng (ví dụ: Basic, Slide, Zoom)
  keywords: string[];
  defaultDuration?: number; // Thời lượng mặc định (giây)
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out"; // Đường cong nội suy
  params: TransitionParamDefinition[]; // Lược đồ cấu hình tham số tùy chỉnh
  renderer: TransitionRenderer;
}
```

### `TransitionRenderer`
Thực thi các lệnh vẽ đồ họa Canvas 2D để pha trộn hai bề mặt hình ảnh:
```typescript
export interface TransitionRenderContext {
  fromCanvas: Canvas | null; // Khung hình clip cũ kết thúc
  toCanvas: Canvas | null;   // Khung hình clip mới bắt đầu
  progress: number;          // Tiến trình chuyển cảnh (0.0 đến 1.0, đã qua easing)
  params: Record<string, any>; // Các giá trị tham số tùy chỉnh
  width: number;
  height: number;
  output: CanvasRenderingContext2D; // Canvas context đích để vẽ kết quả lên đó
}

export interface TransitionRenderer {
  render(ctx: TransitionRenderContext): void;
}
```

---

## 🚀 3. Cách thêm một Transition mới (Từng bước một)

Để thêm một hiệu ứng chuyển cảnh mới (ví dụ: `"wipe_right"`):

### Bước 1: Tạo tệp đặc tả hiệu ứng
Tạo một tệp tin mới trong thư mục `src/transitions/definitions/` (ví dụ `wipe.ts`):

```typescript
import type { TransitionDefinition } from "../types";

export const wipeRightDefinition: TransitionDefinition = {
  type: "wipe_right",
  name: "Wipe Right",
  group: "Slide",
  keywords: ["wipe", "right", "slide", "reveal"],
  defaultDuration: 0.5,
  easing: "ease-in-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const boundaryX = progress * width;

      // Vẽ clip cũ ở vùng bên trái màn hình
      if (fromCanvas) {
        output.save();
        output.beginPath();
        output.rect(boundaryX, 0, width - boundaryX, height);
        output.clip();
        output.drawImage(fromCanvas, 0, 0, width, height);
        output.restore();
      }

      // Vẽ clip mới ở vùng bên phải màn hình
      if (toCanvas) {
        output.save();
        output.beginPath();
        output.rect(0, 0, boundaryX, height);
        output.clip();
        output.drawImage(toCanvas, 0, 0, width, height);
        output.restore();
      }
    }
  }
};
```

### Bước 2: Đăng ký hiệu ứng vào Registry chính
Import và khai báo đăng ký hiệu ứng mới trong `src/transitions/definitions/index.ts`:

```typescript
import { wipeRightDefinition } from "./wipe";

export function registerDefaultTransitions(): void {
  registerTransitions(
    // ... các transition khác
    wipeRightDefinition
  );
}
```

Chỉ với 2 bước trên, bộ kết xuất sẽ tự động nhận diện và vẽ hiệu ứng `"wipe_right"` bất cứ khi nào nó xuất hiện trong dòng thời gian manifest!
