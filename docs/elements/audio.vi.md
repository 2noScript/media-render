# Đặc tả Phần tử Âm thanh (`audio`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp nhạc nền/âm thanh trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "background-music-example",
  "name": "Synth BGM",
  "type": "audio",
  "sourceUrl": "./test-assets/synth_bgm.mp3",
  "startTime": 0.5,
  "duration": 7.5,
  "trimStart": 1.0,
  "trimEnd": 0.5,
  "params": {
    "volume": 0.4,
    "muted": false
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"audio"` | Phải được đặt chính xác là `"audio"`. |
| `sourceUrl` | `string` | *Bắt buộc* | Đường dẫn cục bộ hoặc URL từ xa trỏ tới tệp âm thanh (`.mp3`, `.wav`...). |
| `startTime` | `number` | `0` | Thời điểm bắt đầu phát trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng phát trên dòng thời gian (giây). |
| `trimStart` | `number` | `0` | Thời gian cắt bớt ở đầu tài nguyên âm thanh gốc (giây). |
| `trimEnd` | `number` | `0` | Thời gian cắt bớt ở cuối tài nguyên âm thanh gốc (giây). |
| `hidden` | `boolean` | `false` | Ẩn không phát âm thanh này nếu đặt là `true`. |
| `retime` | `object` | *Không bắt buộc* | Cấu hình thay đổi tốc độ phát (ví dụ: `{ "rate": 1.5 }`). |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `volume` | `number` | `1.0` | Hệ số âm lượng đầu ra (`0.0` đến `1.0`). |
| `muted` | `boolean` | `false` | Tắt âm riêng của phần tử này nếu được đặt là `true`. |
