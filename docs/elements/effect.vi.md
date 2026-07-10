# Đặc tả Phần tử Hiệu ứng Màn hình (`effect`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp hiệu ứng lọc màn hình (screen filter) và bộ phủ hiệu ứng trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "vignette-effect-example",
  "name": "Soft Vignette",
  "type": "effect",
  "effectType": "vignette",
  "startTime": 0.0,
  "duration": 5.0,
  "params": {
    "color": "black",
    "intensity": 0.6,
    "smoothness": 0.5
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"effect"` | Phải được đặt chính xác là `"effect"`. |
| `effectType` | `string` | *Bắt buộc* | Thể loại hiệu ứng lọc áp dụng lên màn hình (hiện hỗ trợ `"vignette"`). |
| `startTime` | `number` | `0` | Thời điểm bắt đầu kích hoạt hiệu ứng trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng hiệu ứng hoạt động trên dòng thời gian (giây). |

### Tham số tùy chỉnh (`params`)
Áp dụng cho `effectType: "vignette"`:
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `color` | `string` | `"black"` | Màu tối bo góc viền màn hình của vignette. |
| `intensity` | `number` | `0.5` | Cường độ/độ mờ che phủ của hiệu ứng vignette (`0.0` đến `1.0`). |
| `smoothness` | `number` | `0.5` | Độ mượt co giãn gradient chuyển sắc từ tâm (`0.0` đến `1.0`). |
