# Đặc tả cấu trúc Track dòng thời gian (Timeline Track)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, phân loại, cơ chế phân tầng (layering) và cách tổ chức các track bên trong manifest của hệ thống OpenCut.

## 📝 Ví dụ về cấu trúc đối tượng Tracks

Các track sắp xếp các phần tử vào các kênh song song bao gồm âm thanh, hình ảnh chính, văn bản phụ đề và hiệu ứng màn hình dưới đối tượng `tracks` của manifest:

```json
{
  "tracks": {
    "main": {
      "id": "track-main-video",
      "name": "Main Visual Track",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "bg-clip-1",
          "type": "video",
          "sourceUrl": "./test-assets/mov_bbb.mp4",
          "startTime": 0,
          "duration": 5.0,
          "params": {}
        }
      ]
    },
    "audio": [],
    "overlay": []
  }
}
```

## ⚙️ Các thuộc tính của Track

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của track. |
| `name` | `string` | Không | Nhãn thân thiện hiển thị trên giao diện người dùng. |
| `type` | `string` | *Bắt buộc* | Phân loại phần tử mà track này chứa: `"video"`, `"audio"`, `"text"`, `"graphic"`, hoặc `"effect"`. |
| `isMain` | `boolean` | Không | Đánh dấu track này là dòng chính của video (chỉ áp dụng cho track `main`). |
| `muted` | `boolean` | Không | Tắt toàn bộ âm thanh của tất cả các phần tử nằm trong track này. |
| `hidden` | `boolean` | Không | Ẩn hiển thị hình ảnh của tất cả các phần tử nằm trong track này. |
| `elements` | `array` | Không | Danh sách các đối tượng phần tử (ví dụ: VideoElement, ImageElement, TransitionElement, AudioElement, TextElement). |

## 🥞 Xếp chồng và phân lớp Z-Index (Layering)

Bộ kết xuất (rendering engine) thực hiện xếp chồng các lớp hình ảnh lên canvas dựa trên cấu trúc các trường trong đối tượng `tracks`:
1. **Thứ tự xếp chồng (Z-Index):**
   - **`main` Track:** Được vẽ đầu tiên, nằm ở dưới cùng của khung hình (phù hợp cho video nền).
   - **`overlay` Tracks:** Được xử lý theo **thứ tự đảo ngược**. Nghĩa là phần tử overlay đầu tiên trong mảng (chỉ số `0`, ví dụ video nhỏ Picture-in-Picture) sẽ được vẽ ngay đè lên trên `main`, và các phần tử tiếp theo sẽ xếp chồng dần lên trên nó.
2. **Ưu tiên văn bản phụ đề (Text Priority):** Các track văn bản hoặc phụ đề chữ chạy nên được đặt ở vị trí cuối cùng trong mảng `overlay` để đảm bảo chúng không bị che khuất bởi các video phụ hay hình ảnh hiệu ứng khác.
3. **Phần tử chuyển cảnh (Transition Elements):** Các phần tử chuyển cảnh (`type: "transition"`) nằm trực tiếp trên `VideoTrack` (như track `main`) ngay tại vị trí giao nhau giữa hai clip liền kề để trộn khung hình của chúng bằng canvas trung gian.
