# Đặc tả Phần tử Video (`video`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp clip video trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "landscape-clip-example",
  "name": "Landscape Bunny Clip",
  "type": "video",
  "sourceUrl": "./test-assets/mov_bbb.mp4",
  "duration": 5.0,
  "startTime": 0,
  "trimStart": 0,
  "trimEnd": 0,
  "isSourceAudioEnabled": true,
  "params": {
    "volume": 0.5,
    "width": 360,
    "height": 202,
    "transform.positionX": 0,
    "transform.positionY": 0,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 0,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 1.0,
    "blurIntensity": 20
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"video"` | Phải được đặt chính xác là `"video"`. |
| `sourceUrl` | `string` | *Bắt buộc* | Đường dẫn tệp tin cục bộ hoặc URL từ xa trỏ tới video. |
| `startTime` | `number` | `0` | Thời điểm bắt đầu phát trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng phát trên dòng thời gian (giây). |
| `trimStart` | `number` | `0` | Thời gian cắt bớt ở đầu tài nguyên gốc (giây). |
| `trimEnd` | `number` | `0` | Thời gian cắt bớt ở cuối tài nguyên gốc (giây). |
| `isSourceAudioEnabled`| `boolean`| `false` | Cho phép tách và trộn kênh âm thanh gốc của video. |
| `hidden` | `boolean` | `false` | Ẩn không hiển thị clip này nếu đặt là `true`. |
| `retime` | `object` | *Không bắt buộc* | Cấu hình thay đổi tốc độ phát (ví dụ: `{ "rate": 1.5 }`). |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `volume` | `number` | `1.0` | Hệ số âm lượng đầu ra (`0.0` đến `1.0`). |
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
