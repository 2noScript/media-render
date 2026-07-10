# Đặc tả Phần tử Văn bản (`text`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số để dựng hình chữ viết, tiêu đề, phụ đề và nhãn hội thoại trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "font-text-example",
  "name": "Bangers Font Segment",
  "type": "text",
  "startTime": 5.9,
  "duration": 2.0,
  "fontUrl": "https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf",
  "params": {
    "content": "Bangers Comic Regular Outline (Cyan)",
    "fontSize": 44,
    "color": "#00FFFF",
    "fontFamily": "Bangers",
    "strokeColor": "#333333",
    "strokeWidth": 2,
    "textAlign": "center",
    "background.enabled": true,
    "background.color": "rgba(0, 0, 0, 0.6)",
    "background.cornerRadius": 30,
    "background.paddingX": 10,
    "background.paddingY": 10,
    "background.offsetX": 0,
    "background.offsetY": 0,
    "transform.positionX": 0,
    "transform.positionY": 80
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"text"` | Phải được đặt chính xác là `"text"`. |
| `startTime` | `number` | `0` | Thời điểm bắt đầu hiển thị trên dòng thời gian (giây). |
| `duration` | `number` | `0` | Thời lượng hiển thị trên dòng thời gian (giây). |
| `fontUrl` | `string` | *Không bắt buộc* | URL tải phông chữ tùy chỉnh từ xa (`.ttf` hoặc `.otf`). |
| `hidden` | `boolean` | `false` | Ẩn không hiển thị văn bản này nếu đặt là `true`. |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `content` | `string` | `""` | Nội dung văn bản hiển thị. |
| `fontFamily` | `string` | `"sans-serif"` | Tên gia đình phông chữ (phải trùng tên trong tệp `fontUrl` nếu tải từ xa). |
| `fontSize` | `number` | `40` | Kích thước chữ hiển thị (pixel). |
| `fontWeight` | `string` | `"normal"` | Độ đậm của chữ (ví dụ: `"normal"`, `"bold"`, `"500"`). |
| `color` | `string` | `"white"` | Màu tô lòng chữ (mã màu hex, RGB/A, hoặc tên màu tiếng Anh). |
| `textAlign` | `string` | `"center"` | Căn lề ngang của chữ: `"left"`, `"center"`, `"right"`, `"start"`, `"end"`. |
| `strokeColor` | `string` | *Không bắt buộc* | Màu viền ngoài của nét chữ (tạo tương phản cao cho phụ đề). |
| `strokeWidth` | `number` | *Không bắt buộc* | Độ dày viền chữ hiển thị (pixel). |

### Tham số biến dạng Transform (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Vị trí X dịch ngang so với tâm màn hình. |
| `transform.positionY` | `number` | `0` | Vị trí Y dịch dọc so với tâm màn hình. |

### Tham số nền hộp văn bản (`params`)
OpenCut định nghĩa nền hộp phía sau văn bản bằng cách sử dụng các trường dạng chấm (dot-notation) trong `params`:
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `background.enabled` | `boolean` | `false` | Bật/tắt hộp nền phía sau chữ. |
| `background.color` | `string` | `"transparent"`| Màu hộp nền phía sau chữ. |
| `background.cornerRadius`| `number` | `0` | Độ bo tròn góc hộp nền (`0` đến `100`). |
| `background.paddingX` | `number` | `8` | Khoảng đệm rìa ngang xung quanh văn bản (pixel). |
| `background.paddingY` | `number` | `8` | Khoảng đệm rìa dọc xung quanh văn bản (pixel). |
| `background.offsetX` | `number` | `0` | Độ lệch vị trí X của hộp nền so với chữ. |
| `background.offsetY` | `number` | `0` | Độ lệch vị trí Y của hộp nền so với chữ. |
