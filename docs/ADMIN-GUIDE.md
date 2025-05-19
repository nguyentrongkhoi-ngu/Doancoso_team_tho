# Hướng dẫn quản trị Website E-Commerce AI

Tài liệu này cung cấp hướng dẫn chi tiết về cách quản lý và vận hành hệ thống E-Commerce AI dành cho quản trị viên.

## Mục lục

- [Đăng nhập Admin](#đăng-nhập-admin)
- [Tổng quan Dashboard](#tổng-quan-dashboard)
- [Quản lý Sản phẩm](#quản-lý-sản-phẩm)
- [Quản lý Đơn hàng](#quản-lý-đơn-hàng)
- [Quản lý Người dùng](#quản-lý-người-dùng)
- [Báo cáo Phân tích](#báo-cáo-phân-tích)
- [Báo cáo Hệ thống Gợi ý](#báo-cáo-hệ-thống-gợi-ý)
- [Cấu hình Hệ thống](#cấu-hình-hệ-thống)
- [Xử lý Sự cố](#xử-lý-sự-cố)

## Đăng nhập Admin

1. Truy cập vào trang `/admin/login`
2. Nhập thông tin đăng nhập quản trị viên:
   - Email: đã được thiết lập trong quá trình cài đặt
   - Mật khẩu: mật khẩu quản trị viên
3. Hệ thống sẽ chuyển hướng đến trang Dashboard sau khi đăng nhập thành công

## Tổng quan Dashboard

Dashboard Admin cung cấp tổng quan về:

- **Thống kê bán hàng**: Doanh thu, số đơn hàng, giá trị đơn hàng trung bình
- **Sản phẩm nổi bật**: Top sản phẩm bán chạy, sản phẩm xem nhiều
- **Hành vi người dùng**: Số lượng người dùng mới, tỷ lệ chuyển đổi
- **Hiệu quả hệ thống gợi ý**: CTR, tỷ lệ chuyển đổi từ gợi ý sản phẩm

Các biểu đồ và chỉ số được cập nhật theo thời gian thực. Quản trị viên có thể lọc thông tin theo khoảng thời gian (ngày, tuần, tháng, năm).

## Quản lý Sản phẩm

### Xem danh sách sản phẩm

1. Truy cập mục **Sản phẩm** từ menu bên trái
2. Danh sách sản phẩm hiển thị với các thông tin: ID, Tên, Danh mục, Giá, Số lượng tồn kho, Trạng thái
3. Sử dụng bộ lọc phía trên để tìm kiếm và lọc sản phẩm theo danh mục, trạng thái, khoảng giá

### Thêm sản phẩm mới

1. Từ trang danh sách sản phẩm, nhấp vào nút **Thêm sản phẩm mới**
2. Điền đầy đủ thông tin:
   - Tên sản phẩm
   - Mô tả
   - Danh mục
   - Giá
   - Số lượng tồn kho
   - Trạng thái (đang bán, hết hàng, ngừng kinh doanh)
   - Tải lên hình ảnh sản phẩm (tối đa 5 hình)
   - Tags và thuộc tính
3. Nhấn **Lưu** để hoàn tất

### Chỉnh sửa hoặc xóa sản phẩm

1. Từ danh sách sản phẩm, nhấp vào biểu tượng **Chỉnh sửa** (hình bút) bên cạnh sản phẩm
2. Cập nhật thông tin cần thiết
3. Nhấn **Lưu** để cập nhật
4. Để xóa sản phẩm, nhấp vào biểu tượng **Xóa** (thùng rác) và xác nhận

### Nhập hàng loạt

1. Từ trang danh sách sản phẩm, nhấp vào nút **Nhập Excel**
2. Tải xuống mẫu Excel nếu cần
3. Tải lên file Excel đã điền thông tin sản phẩm
4. Xác nhận nhập dữ liệu

## Quản lý Đơn hàng

### Xem danh sách đơn hàng

1. Truy cập mục **Đơn hàng** từ menu bên trái
2. Danh sách đơn hàng hiển thị với các thông tin: ID, Khách hàng, Ngày đặt, Tổng tiền, Trạng thái
3. Sử dụng bộ lọc để tìm kiếm theo ID, khách hàng, trạng thái, khoảng thời gian

### Xử lý đơn hàng

1. Nhấp vào ID đơn hàng để xem chi tiết
2. Trang chi tiết hiển thị:
   - Thông tin khách hàng
   - Danh sách sản phẩm
   - Thông tin thanh toán
   - Lịch sử giao dịch
3. Cập nhật trạng thái đơn hàng:
   - Đã xác nhận
   - Đang xử lý
   - Đang giao hàng
   - Đã giao hàng
   - Đã hủy
4. Thêm ghi chú nội bộ nếu cần
5. Nhấn **Lưu** để cập nhật

### Xuất hóa đơn

1. Từ trang chi tiết đơn hàng, nhấp vào nút **Xuất hóa đơn**
2. Hệ thống sẽ tạo file PDF hóa đơn
3. Tùy chọn để gửi hóa đơn qua email cho khách hàng

## Quản lý Người dùng

### Xem danh sách người dùng

1. Truy cập mục **Người dùng** từ menu bên trái
2. Danh sách hiển thị với thông tin: ID, Họ tên, Email, Ngày đăng ký, Trạng thái
3. Sử dụng bộ lọc để tìm kiếm theo tên, email, trạng thái

### Xem chi tiết người dùng

1. Nhấp vào tên người dùng để xem chi tiết
2. Trang chi tiết hiển thị:
   - Thông tin cá nhân
   - Lịch sử đơn hàng
   - Lịch sử tương tác
   - Sản phẩm đã xem/mua
   - Danh mục yêu thích

### Quản lý quyền truy cập

1. Từ trang chi tiết người dùng, nhấp vào tab **Quyền truy cập**
2. Cấp hoặc thu hồi quyền:
   - Người dùng thông thường
   - Quản trị viên
   - Nhân viên (quyền giới hạn)
3. Nhấn **Lưu** để cập nhật

## Báo cáo Phân tích

### Báo cáo Doanh thu

1. Truy cập mục **Báo cáo** > **Doanh thu**
2. Chọn khoảng thời gian cần xem báo cáo
3. Xem biểu đồ doanh thu theo ngày/tuần/tháng
4. Phân tích theo danh mục sản phẩm
5. Xuất báo cáo dưới dạng PDF, Excel

### Báo cáo Người dùng

1. Truy cập mục **Báo cáo** > **Người dùng**
2. Xem thống kê về:
   - Người dùng mới
   - Tỷ lệ chuyển đổi
   - Phân bố địa lý
   - Thiết bị sử dụng
3. Xuất báo cáo nếu cần

## Báo cáo Hệ thống Gợi ý

1. Truy cập mục **Báo cáo** > **Gợi ý AI**
2. Chọn khoảng thời gian (ngày, tuần, tháng)
3. Xem báo cáo chi tiết:
   - Tổng số lượt hiển thị gợi ý
   - Click-through Rate (CTR)
   - Conversion Rate (CR)
   - Hiệu quả theo loại thuật toán (TensorFlow.js, Hybrid, Collaborative, Content-based)
   - Biểu đồ so sánh hiệu quả
4. Xem phân tích A/B Testing tự động
5. Xuất báo cáo dưới dạng PDF, Excel

## Cấu hình Hệ thống Gợi ý

1. Truy cập mục **Cấu hình** > **Hệ thống Gợi ý**
2. Điều chỉnh tham số:
   - Bật/tắt từng thuật toán
   - Điều chỉnh trọng số thuật toán
   - Cấu hình tần suất cập nhật model
   - Thiết lập ngưỡng điểm số cho gợi ý
3. Nhấn **Lưu cấu hình** để áp dụng

## Cấu hình Hệ thống

### Cấu hình chung

1. Truy cập mục **Cấu hình** > **Chung**
2. Cấu hình thông tin website:
   - Tên website
   - Logo
   - Thông tin liên hệ
   - Mạng xã hội
3. Nhấn **Lưu** để cập nhật

### Cấu hình thanh toán

1. Truy cập mục **Cấu hình** > **Thanh toán**
2. Cấu hình các phương thức thanh toán:
   - Stripe API keys
   - PayPal
   - Thanh toán khi nhận hàng
3. Nhấn **Lưu** để cập nhật

### Cấu hình Email

1. Truy cập mục **Cấu hình** > **Email**
2. Cấu hình máy chủ SMTP:
   - Địa chỉ máy chủ
   - Port
   - Tên người dùng
   - Mật khẩu
3. Tùy chỉnh mẫu email
4. Kiểm tra cấu hình bằng cách gửi email test
5. Nhấn **Lưu** để cập nhật

## Xử lý Sự cố

### Nhật ký hệ thống

1. Truy cập mục **Hệ thống** > **Nhật ký**
2. Xem log hệ thống với các mức độ:
   - Thông tin
   - Cảnh báo
   - Lỗi
   - Nghiêm trọng
3. Lọc log theo ngày, loại, mức độ

### Sao lưu và khôi phục

1. Truy cập mục **Hệ thống** > **Sao lưu**
2. Tạo bản sao lưu mới
3. Xem danh sách bản sao lưu cũ
4. Khôi phục từ bản sao lưu nếu cần

### Liên hệ hỗ trợ kỹ thuật

Nếu gặp vấn đề không thể tự giải quyết, vui lòng liên hệ với đội ngũ hỗ trợ kỹ thuật:

- Email: support@example.com
- Hotline: 1900-xxx-xxx (Giờ làm việc: 8:00 - 17:30, Thứ 2 - Thứ 6)

## Tài liệu tham khảo

- [Tài liệu về hệ thống gợi ý AI](./AI-RECOMMENDATION-SYSTEM.md)
- [API Documentation](./API-DOCS.md)
- [Cập nhật và phiên bản mới](./CHANGELOG.md) 