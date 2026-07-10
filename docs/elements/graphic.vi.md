# Đặc tả Phần tử Đồ họa Vector (`graphic`)

Tài liệu này định nghĩa cấu trúc dữ liệu JSON, thuộc tính và các tham số cho lớp hình khối đồ họa (graphic shape) và hình họa đè trên dòng thời gian.

## 📝 Ví dụ cấu trúc Element

```json
{
  "id": "solid-color-graphic",
  "name": "Red Accent Box",
  "type": "graphic",
  "definitionId": "rectangle",
  "startTime": 0.0,
  "duration": 5.0,
  "params": {
    "color": "#FF0000",
    "width": 100,
    "height": 100,
    "transform.positionX": -200,
    "transform.positionY": 100,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 45,
    "opacity": 0.8
  }
}
```

## ⚙️ Các Thuộc tính & Tham số

### Các thuộc tính Root
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Bắt buộc* | Mã định danh duy nhất của phần tử. |
| `name` | `string` | `""` | Tên hiển thị thân thiện trên UI. |
| `type` | `string` | `"graphic"` | Phải được đặt chính xác là `"graphic"`. |
| `definitionId` | `string` | *Bắt buộc* | Thể loại khối đồ họa (hiện hỗ trợ các dạng hình học cơ bản như `"rectangle"`). |
| `startTime` | `number` | `0` | Thời điểm bắt đầu xuất hiện trên dòng thời gian (giây). |
| `duration` | `number` | *Bắt buộc* | Thời lượng hiển thị trên dòng thời gian (giây). |
| `hidden` | `boolean` | `false` | Ẩn không hiển thị hình khối này nếu đặt là `true`. |

### Tham số tùy chỉnh (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `color` | `string` | `"transparent"`| Màu tô kín lòng hình khối đồ họa. |
| `width` | `number` | `100` | Chiều rộng cơ sở của khung bao hình khối (pixel). |
| `height` | `number` | `100` | Chiều cao cơ sở của khung bao hình khối (pixel). |
| `opacity` | `number` | `1.0` | Độ trong suốt hiển thị (`0.0` đến `1.0`). |

### Tham số biến dạng Transform (`params`)
| Tên tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Vị trí X dịch ngang so với tâm màn hình. |
| `transform.positionY` | `number` | `0` | Vị trí Y dịch dọc so với tâm màn hình. |
| `transform.scaleX` | `number` | `1.0` | Tỉ lệ co giãn chiều ngang. |
| `transform.scaleY` | `number` | `1.0` | Tỉ lệ co giãn chiều dọc. |
| `transform.rotate` | `number` | `0` | Góc xoay chiều kim đồng hồ (độ). |
| `transform.flipX` | `boolean` | `false` | Lật ngược hình khối theo chiều ngang. |
| `transform.flipY` | `boolean` | `false` | Lật ngược hình khối theo chiều dọc. |
