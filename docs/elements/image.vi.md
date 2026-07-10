# Đặc tả Phần tử Hình ảnh (`image`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp hình ảnh tĩnh trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "picsum-image-example",
  "name": "Picsum Image",
  "type": "image",
  "sourceUrl": "https://picsum.photos/640/360",
  "duration": 5.0,
  "startTime": 0,
  "params": {
    "width": 640,
    "height": 360,
    "transform.positionX": 0,
    "transform.positionY": 0,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 0,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 1.0,
    "blurIntensity": 15
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"image"` | Phải được đặt chính xác là `"image"`. |
| `sourceUrl` | `string` | *Bắt buộc* | Đường dẫn tệp tin cục bộ hoặc URL từ xa trỏ tới tệp ảnh (`.png`, `.jpg`, `.jpeg`). |
| `startTime` | `number` | `0` | Thời điểm bắt đầu hiển thị trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng hiển thị trên dòng thời gian (giây). |
| `hidden` | `boolean` | `false` | Ẩn không hiển thị ảnh này nếu đặt là `true`. |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `width` | `number` | *Rộng gốc* | Chiều rộng hiển thị cơ sở trước khi co giãn scale. |
| `height` | `number` | *Cao gốc*| Chiều cao hiển thị cơ sở trước khi co giãn scale. |
| `opacity` | `number` | `1.0` | Độ trong suốt hiển thị (`0.0` đến `1.0`). |
| `blurIntensity` | `number` | *Không bắt buộc* | Độ mờ Gaussian viền hình nền khi lấp đầy khung hình. |

### Tham số biến dạng Transform (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Vị trí X dịch ngang so với tâm màn hình. |
| `transform.positionY` | `number` | `0` | Vị trí Y dịch dọc so với tâm màn hình. |
| `transform.scaleX` | `number` | `1.0` | Tỉ lệ co giãn chiều ngang. |
| `transform.scaleY` | `number` | `1.0` | Tỉ lệ co giãn chiều dọc. |
| `transform.rotate` | `number` | `0` | Góc xoay chiều kim đồng hồ (độ). |
| `transform.flipX` | `boolean` | `false` | Lật ngược hình ảnh theo chiều ngang. |
| `transform.flipY` | `boolean` | `false` | Lật ngược hình ảnh theo chiều dọc. |
