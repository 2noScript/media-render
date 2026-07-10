# Đặc tả Thiết kế: Quy tắc Xếp lớp Z-Index và Sắp xếp Track

Đặc tả này chi tiết hóa logic sắp xếp các track, ưu tiên phần tử hiển thị và phân lớp Z-index để tạo nên cây dựng hình (Scene Graph) có thể dự đoán được từ `EditorManifest`.

---

## 🎨 1. Thứ tự Phân lớp (Từ dưới lên trên)

Để khung hình cuối cùng được dựng chính xác, các lớp hình ảnh phải được vẽ theo thứ tự từ nền phía sau ra cận cảnh phía trước. Thứ tự này tương ứng với thứ tự thêm các node vào `RootNode` (node thêm vào trước sẽ được vẽ trước/ở dưới cùng):

```
+-------------------------------------------------------+  ▲
|  Lớp 3: Overlays (Chữ phụ đề / Nhãn dán / Video PIP)   |  │ (Vẽ sau cùng - Trên cùng)
+-------------------------------------------------------+  │
|  Lớp 2: Main Video (Các clip nền chính)               |  │ Thứ tự Z-Index
+-------------------------------------------------------+  │
|  Lớp 1: Background Backdrop (Màu nền / Video mờ biên) |  │ (Vẽ đầu tiên - Dưới cùng)
+-------------------------------------------------------+  ▼
```

### 1.1 Lớp 1: Background Backdrop (Z-Index: 0)
Hình nền luôn được vẽ đầu tiên để tạo nền vững chắc:
*   **Màu nền (Color Background)**: Nếu cấu hình màu nền (ví dụ: `#000000`), một `ColorNode` được thêm vào trước.
*   **Nền mờ (Blurred Background)**: Nếu yêu cầu nền mờ (`background.type === "blur"`), bộ tổng hợp sẽ lấy các video trên track chính và nhân bản chúng thành một `BlurBackgroundNode` kéo giãn ra toàn màn hình và làm mờ viền làm nền lót dưới cùng.

### 1.2 Lớp 2: Main Video Track (Z-Index: 1)
*   Đại diện cho dòng câu chuyện chính của video, được định nghĩa trực tiếp tại `tracks.main`.
*   Các phần tử trên track này được vẽ đè trực tiếp lên lớp nền Backdrop.

### 1.3 Lớp 3: Overlay Tracks (Z-Index: 2+)
*   Chứa các track bổ sung như ảnh đè, video phụ họa Picture-in-Picture (PiP), nhãn dán (sticker), và chữ phụ đề (subtitle/text).
*   **Thứ tự xếp chồng giữa các Overlay**:
    - Trong manifest, overlays được liệt kê trong mảng `tracks.overlay = [Overlay_0, Overlay_1, ..., Overlay_N]`.
    - Để đảm bảo phần tử overlay đầu tiên (`Overlay_0` - thường chứa phụ đề chính) hiển thị ở trên cùng, các track này được xử lý theo **thứ tự ngược lại**:
      $$\text{Thứ tự vẽ: } \text{MainTrack} \longrightarrow \text{Overlay}_N \longrightarrow \text{Overlay}_{N-1} \longrightarrow \dots \longrightarrow \text{Overlay}_0$$
    - Do đó, `Overlay_0` sẽ được thêm cuối cùng vào Scene Graph và nằm trên cùng.

---

## 📝 2. Chi tiết Quy chuẩn Phân loại Track

Hệ thống hỗ trợ 4 kiểu track dòng thời gian chính:

1.  **Video Track (`type: "video"`)**
    - **Phần tử được phép**: `video`, `image`, `transition`.
    - **Main Track**: Nằm dưới `tracks.main`, đóng vai trò làm nền cốt lõi của video ở lớp Z-Index: 1.
    - **Overlay Track**: Nằm dưới `tracks.overlay`, đặt video phụ PIP đè lên video chính ở lớp Z-Index: 2+.
2.  **Text Track (`type: "text"`)**
    - **Phần tử được phép**: `text`.
    - Vị trí mặc định ở lớp Z-Index cao nhất để đảm bảo chữ không bị che bởi sticker hay video PIP.
3.  **Sticker Track (`type: "sticker"`)**
    - **Phần tử được phép**: `sticker`.
    - Thường được sắp xếp nằm giữa lớp video và phụ đề chữ.
4.  **Effect Track (`type: "effect"`)**
    - **Phần tử được phép**: `effect`.
    - Áp dụng các bộ lọc màu, vignette cho toàn bộ khung cảnh bên dưới.
