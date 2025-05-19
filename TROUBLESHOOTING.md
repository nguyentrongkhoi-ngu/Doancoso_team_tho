# Hướng dẫn khắc phục sự cố API

## Lỗi API "Toggle Featured" (404 Not Found)

Nếu bạn gặp lỗi 404 khi sử dụng tính năng toggle-featured trong trang admin/products, hãy thực hiện các bước sau để khắc phục sự cố:

### 1. Kiểm tra kết nối API

1. Truy cập trang `/admin/products`
2. Component kiểm tra API sẽ tự động chạy và hiển thị kết quả
3. Nếu có lỗi, hãy click vào nút "Kiểm tra API Featured" để xem chi tiết

### 2. Kiểm tra log server

1. Kiểm tra terminal đang chạy Next.js server để xem log chi tiết
2. Tìm các message bắt đầu bằng "Toggle Featured API:" để xem lỗi

### 3. Kiểm tra API từ command line

Bạn có thể sử dụng script debug để kiểm tra API trực tiếp:

```bash
# Cài đặt node-fetch nếu chưa có
npm install node-fetch

# Kiểm tra API check endpoint
node api-debug.js test-check

# Kiểm tra API toggle-featured endpoint
node api-debug.js test-featured
```

### 4. Các vấn đề thường gặp

#### 404 Not Found

- **Nguyên nhân**: API route không được tạo đúng cách hoặc không thể truy cập
- **Giải pháp**: 
  - Đảm bảo file `route.ts` nằm trong thư mục đúng: `/src/app/api/admin/products/toggle-featured/`
  - Thực hiện restart Next.js server

#### 401 Unauthorized

- **Nguyên nhân**: Người dùng chưa đăng nhập hoặc phiên đăng nhập hết hạn
- **Giải pháp**: Đăng nhập lại với tài khoản admin

#### 403 Forbidden

- **Nguyên nhân**: Tài khoản không có quyền admin
- **Giải pháp**: Đăng nhập bằng tài khoản có quyền admin

### 5. Cách giải quyết lỗi dài hạn

Nếu vẫn gặp vấn đề, hãy thực hiện các bước sau:

1. Restart Next.js server
2. Xóa cache bằng cách:
   ```bash
   rm -rf .next
   npm run build
   npm run start
   ```
3. Thử lại từ đầu

### 6. Liên hệ hỗ trợ

Nếu bạn đã thử tất cả các giải pháp trên mà vẫn gặp lỗi, vui lòng liên hệ đội phát triển với các thông tin sau:

1. Mã lỗi đầy đủ
2. Log server
3. Log console từ trình duyệt
4. Các bước đã thử để khắc phục 