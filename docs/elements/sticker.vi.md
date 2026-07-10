# Đặc tả Phần tử Nhãn dán (`sticker`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp nhãn dán hình ảnh (sticker) và hoạt ảnh phủ trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "animated-sticker-example",
  "name": "Wow Sticker",
  "type": "sticker",
  "stickerId": "wow_sticker",
  "sourceUrl": "https://example.com/assets/wow.png",
  "startTime": 1.0,
  "duration": 3.0,
  "params": {
    "transform.positionX": 120,
    "transform.positionY": -50,
    "transform.scaleX": 1.2,
    "transform.scaleY": 1.2,
    "transform.rotate": 15,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 0.9
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"sticker"` | Phải được đặt chính xác là `"sticker"`. |
| `stickerId` | `string` | *Bắt buộc* | Mã định danh mẫu của nhãn dán. |
| `sourceUrl` | `string` | *Không bắt buộc* | Đường dẫn tệp tin cục bộ hoặc URL tải tài nguyên hình ảnh của sticker. |
| `intrinsicWidth` | `number` | *Không bắt buộc* | Chiều rộng hiển thị gốc của sticker (pixel). |
| `intrinsicHeight`| `number` | *Không bắt buộc* | Chiều cao hiển thị gốc của sticker (pixel). |
| `startTime` | `number` | `0` | Thời điểm bắt đầu hiển thị trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng hiển thị trên dòng thời gian (giây). |
| `hidden` | `boolean` | `false` | Ẩn không hiển thị sticker này nếu đặt là `true`. |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `opacity` | `number` | `1.0` | Độ trong suốt hiển thị (`0.0` đến `1.0`). |

### Tham số biến dạng Transform (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Vị trí X dịch ngang so với tâm màn hình. |
| `transform.positionY` | `number` | `0` | Vị trí Y dịch dọc so với tâm màn hình. |
| `transform.scaleX` | `number` | `1.0` | Tỉ lệ co giãn chiều ngang. |
| `transform.scaleY` | `number` | `1.0` | Tỉ lệ co giãn chiều dọc. |
| `transform.rotate` | `number` | `0` | Góc xoay chiều kim đồng hồ (độ). |
| `transform.flipX` | `boolean` | `false` | Lật ngược sticker theo chiều ngang. |
| `transform.flipY` | `boolean` | `false` | Lật ngược sticker theo chiều dọc. |
