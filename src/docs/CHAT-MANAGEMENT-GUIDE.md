# Hướng dẫn sử dụng hệ thống quản lý trò chuyện

Tài liệu này cung cấp hướng dẫn chi tiết về cách sử dụng hệ thống quản lý trò chuyện trong trang quản trị.

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Truy cập hệ thống](#truy-cập-hệ-thống)
3. [Giao diện quản lý trò chuyện](#giao-diện-quản-lý-trò-chuyện)
4. [Quản lý phiên trò chuyện](#quản-lý-phiên-trò-chuyện)
5. [Thống kê trò chuyện](#thống-kê-trò-chuyện)
6. [Xử lý thông báo](#xử-lý-thông-báo)
7. [Các trạng thái phiên trò chuyện](#các-trạng-thái-phiên-trò-chuyện)
8. [API Endpoints](#api-endpoints)

## Tổng quan

Hệ thống quản lý trò chuyện cho phép quản trị viên theo dõi, quản lý và phân tích các cuộc trò chuyện giữa người dùng và trợ lý AI. Hệ thống này giúp:

- Theo dõi tất cả các phiên trò chuyện
- Xem lịch sử trò chuyện chi tiết
- Quản lý trạng thái của các phiên trò chuyện
- Xem thống kê về hoạt động trò chuyện
- Nhận thông báo về các phiên trò chuyện mới cần xử lý

## Truy cập hệ thống

1. Đăng nhập vào hệ thống với tài khoản quản trị viên
2. Từ trang quản trị, nhấp vào mục "Quản lý trò chuyện" trong thanh điều hướng bên trái
3. Hệ thống sẽ hiển thị trang quản lý trò chuyện

## Giao diện quản lý trò chuyện

Giao diện quản lý trò chuyện bao gồm các phần chính sau:

1. **Bộ lọc phiên trò chuyện**: Cho phép lọc phiên trò chuyện theo trạng thái (Tất cả, Đang hoạt động, Chờ xử lý, Đã đóng)
2. **Thống kê trò chuyện**: Hiển thị các số liệu tổng hợp về hoạt động trò chuyện
3. **Danh sách phiên trò chuyện**: Hiển thị tất cả các phiên trò chuyện theo bộ lọc đã chọn
4. **Lịch sử trò chuyện**: Hiển thị chi tiết các tin nhắn trong phiên trò chuyện được chọn

## Quản lý phiên trò chuyện

### Xem danh sách phiên trò chuyện

1. Truy cập trang quản lý trò chuyện
2. Sử dụng bộ lọc để hiển thị các phiên trò chuyện theo trạng thái mong muốn
3. Danh sách phiên trò chuyện sẽ hiển thị với các thông tin:
   - Tên người dùng (hoặc "Khách vãng lai" nếu không đăng nhập)
   - Tin nhắn cuối cùng
   - Trạng thái phiên (Đang hoạt động, Chờ xử lý, Đã đóng)
   - Thời gian tin nhắn cuối cùng
   - Số lượng tin nhắn trong phiên

### Xem lịch sử trò chuyện

1. Nhấp vào một phiên trò chuyện trong danh sách
2. Lịch sử trò chuyện sẽ hiển thị ở bên phải, bao gồm tất cả các tin nhắn giữa người dùng và trợ lý AI
3. Tin nhắn của người dùng sẽ hiển thị màu xanh và nằm bên phải
4. Tin nhắn của trợ lý AI sẽ hiển thị màu trắng và nằm bên trái

### Thay đổi trạng thái phiên trò chuyện

1. Chọn một phiên trò chuyện từ danh sách
2. Ở phần trên cùng của lịch sử trò chuyện, nhấp vào nút "Đóng" hoặc "Mở lại" tùy thuộc vào trạng thái hiện tại của phiên
3. Trạng thái phiên sẽ được cập nhật ngay lập tức

## Thống kê trò chuyện

Phần thống kê trò chuyện hiển thị các số liệu quan trọng:

1. **Tổng số tin nhắn**: Tổng số tin nhắn trong tất cả các phiên trò chuyện
2. **Tin nhắn từ người dùng**: Số lượng tin nhắn được gửi bởi người dùng
3. **Phiên đang hoạt động**: Số lượng phiên trò chuyện có trạng thái "Đang hoạt động"
4. **Phiên chờ xử lý**: Số lượng phiên trò chuyện có trạng thái "Chờ xử lý"
5. **Từ khóa phổ biến**: Các từ khóa xuất hiện nhiều nhất trong tin nhắn của người dùng

## Xử lý thông báo

Hệ thống sẽ hiển thị thông báo khi có phiên trò chuyện mới cần xử lý:

1. Khi có phiên trò chuyện ở trạng thái "Chờ xử lý", một thông báo sẽ xuất hiện ở góc dưới bên phải màn hình
2. Thông báo hiển thị số lượng phiên trò chuyện đang chờ xử lý
3. Nhấp vào thông báo để chuyển đến trang quản lý trò chuyện với bộ lọc "Chờ xử lý"

## Các trạng thái phiên trò chuyện

Mỗi phiên trò chuyện có một trong ba trạng thái:

1. **Đang hoạt động (active)**: Phiên trò chuyện đang diễn ra, người dùng và trợ lý AI có thể trao đổi tin nhắn
2. **Chờ xử lý (pending)**: Phiên trò chuyện cần sự chú ý của quản trị viên, thường là khi có vấn đề cần giải quyết
3. **Đã đóng (closed)**: Phiên trò chuyện đã kết thúc, không còn hoạt động

## API Endpoints

Hệ thống quản lý trò chuyện sử dụng các API endpoints sau:

1. **GET /api/admin/chat-sessions**: Lấy danh sách phiên trò chuyện, có thể lọc theo trạng thái
2. **GET /api/admin/chat-sessions/:id**: Lấy thông tin chi tiết và lịch sử tin nhắn của một phiên trò chuyện
3. **PATCH /api/admin/chat-sessions/:id**: Cập nhật trạng thái của một phiên trò chuyện
4. **GET /api/admin/chat-statistics**: Lấy thống kê về hoạt động trò chuyện

---

Nếu bạn có bất kỳ câu hỏi hoặc gặp vấn đề khi sử dụng hệ thống quản lý trò chuyện, vui lòng liên hệ với đội ngũ hỗ trợ kỹ thuật. 