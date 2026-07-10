# Hướng dẫn Nhà phát triển: Thuật toán Kết xuất & Hoạt ảnh

Tài liệu này chi tiết hóa các công thức toán học, thuật toán cốt lõi và cấu trúc logic được sử dụng để ghép khung hình (compositing) và tính toán hoạt ảnh (animations) trong `media-render`.

---

## 1. Thuật toán Ma trận Biến dạng 2D Affine (2D Affine Transformation Matrix)

Để hỗ trợ dịch chuyển vị trí, xoay góc và lật trục xung quanh tâm của một phần tử (custom origin) mà không làm biến dạng bố cục chung, bộ kết xuất áp dụng một chuỗi các phép biến đổi Affine trên đối tượng Skia Canvas 2D.

### Chuỗi phép tính Toán học

Cho một phần tử có tọa độ tâm là $(C_x, C_y)$, góc quay $\theta$ (độ), và hệ số co giãn scale $S_x$ (`flipX ? -1 : 1`) và $S_y$ (`flipY ? -1 : 1`), ma trận biến dạng tổng hợp $M$ được tính như sau:

$$M = T(C_x, C_y) \times R(\theta) \times S(S_x, S_y) \times T(-C_x, -C_y)$$

Trong đó:
*   $T(u, v)$ là ma trận Dịch chuyển vị trí (Translation).
*   $R(\theta)$ là ma trận Xoay góc (Rotation).
*   $S(s_x, s_y)$ là ma trận Co giãn (Scaling).

### Hiện thực trên Skia Canvas (`src/core/renderer/compositor/skia-compositor.ts`)

```typescript
// 1. Dịch chuyển gốc tọa độ của context về tâm của phần tử
targetCtx.translate(transform.centerX, transform.centerY);

// 2. Xoay tọa độ theo góc theta (chuyển đổi độ sang radian)
targetCtx.rotate((transform.rotationDegrees * Math.PI) / 180);

// 3. Thực hiện lật đối xứng / Co giãn trục tọa độ
targetCtx.scale(flipX, flipY);

// 4. Dịch gốc tọa độ ngược lại để thực hiện lệnh vẽ tương đối
targetCtx.translate(-transform.centerX, -transform.centerY);

// 5. Vẽ ảnh nguồn của texture lên canvas
targetCtx.drawImage(textureSource, x, y, transform.width, transform.height);
```

Phép tính này đảm bảo việc xoay góc hoặc lật đối xứng luôn được thực hiện quanh điểm chính giữa thực tế của phần tử chứ không bị lệch theo gốc tọa độ `(0, 0)` mặc định ở góc trên bên trái màn hình.

---

## 2. Thuật toán Nội suy tuyến tính Keyframe (LERP - Linear Interpolation)

Các tham số như tọa độ, tỉ lệ zoom, góc xoay và độ trong suốt có thể thay đổi liên tục theo thời gian dựa trên các mốc khóa (keyframe) được cấu hình từ trình soạn thảo. Hệ thống tính toán các giá trị trung gian tại giây thứ $t$ bằng thuật toán nội suy tuyến tính.

### Công thức Toán học

Nếu thời điểm $t$ nằm giữa hai mốc khóa keyframe $t_1$ và $t_2$, tỉ lệ phân phối $r$ là:

$$r = \frac{t - t_1}{t_2 - t_1}$$

Giá trị nội suy đầu ra $V$ được tính bằng công thức LERP:

$$V = V_1 + (V_2 - V_1) \times r$$

Trong đó $V_1$ là giá trị ở khóa $t_1$ và $V_2$ là giá trị ở khóa $t_2$.

### Hiện thực mã nguồn (`src/core/renderer/animation-resolver.ts`)

```typescript
export function interpolateLinear(startValue: number, endValue: number, ratio: number): number {
  return startValue + (endValue - startValue) * ratio;
}

export function resolveAnimatedValue<T extends number | string | boolean>(
  keyframes: Keyframe<T>[] | undefined,
  localTime: number,
  fallbackValue: T
): T {
  if (!keyframes || keyframes.length === 0) return fallbackValue;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Kiểm tra giới hạn biên
  if (localTime <= sorted[0].time) return sorted[0].value;
  if (localTime >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // Duyệt vòng lặp nội suy tuyến tính
  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    if (localTime >= k1.time && localTime <= k2.time) {
      if (typeof k1.value === "number" && typeof k2.value === "number") {
        const ratio = (localTime - k1.time) / (k2.time - k1.time);
        return interpolateLinear(k1.value, k2.value, ratio) as any;
      }
      return k1.value; // Trả về dạng bước nhảy (step) cho chuỗi chữ hoặc boolean
    }
  }

  return fallbackValue;
}
```

---

## 3. Thuật toán Bộ đệm & Băm ảnh (Texture Cache & Hashing)

Để tối ưu hóa hiệu năng và tránh vẽ lại các texture tĩnh không thay đổi (như nhãn dán, văn bản không động) ở mỗi khung hình, hệ thống áp dụng cơ chế dựng hình gia tăng (Incremental Rendering) dựa trên mã băm nội dung.

### Logic Băm dữ liệu (Hashing)

Mỗi khi một node sinh ra mô tả khung hình (FrameItem), hệ thống tính toán một chuỗi mã băm `contentHash`:
- **Văn bản tĩnh**: Mã băm dựa trên: `content + color + fontSize + fontFamily + strokeWidth`.
- **Hình ảnh tĩnh**: Mã băm dựa trên đường dẫn tệp `sourceUrl`.

### Kiểm tra & Tái sử dụng

Trong lớp `SkiaCompositor` (`src/core/renderer/compositor/skia-compositor.ts`):
1. Khi đồng bộ texture, hệ thống tra cứu mã băm trong bộ nhớ cache.
2. Nếu trùng khớp mã băm và kích thước màn hình không thay đổi, canvas đệm cũ chứa texture đã vẽ trước đó sẽ được tái sử dụng trực tiếp.
3. Nếu mã băm thay đổi (ví dụ: chữ phụ đề thay đổi theo thời gian), bộ compositor sẽ thực hiện giải phóng texture cũ, khởi tạo canvas đệm mới và chạy lại hàm callback để vẽ nội dung mới.
4. Quá trình này giúp nâng cao đáng kể tốc độ render nhờ giảm thiểu số lượng thao tác vẽ đồ họa nặng lặp đi lặp lại.
