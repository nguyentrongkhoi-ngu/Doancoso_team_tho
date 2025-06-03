# Hệ thống Quản lý Trò chuyện E-commerce AI

Hệ thống quản lý trò chuyện cho phép người dùng tương tác với trợ lý AI và quản trị viên có thể quản lý, theo dõi các cuộc trò chuyện.

## Tính năng chính

### Phía người dùng:
- ChatBox tương tác với trợ lý AI
- Hiệu ứng animation mượt mà
- Thông báo tin nhắn mới
- Quick actions để truy cập nhanh các chức năng phổ biến
- Lưu trữ lịch sử trò chuyện

### Phía quản trị viên:
- Quản lý tất cả các phiên trò chuyện
- Lọc phiên chat theo trạng thái (Tất cả, Đang hoạt động, Chờ xử lý, Đã đóng)
- Xem chi tiết lịch sử trò chuyện
- Thống kê về hoạt động trò chuyện
- Thông báo khi có phiên chat mới cần xử lý

## Cấu trúc thư mục

```
src/
├── app/
│   ├── admin/
│   │   ├── chat-management/    # Trang quản lý trò chuyện
│   │   └── page.tsx            # Dashboard admin
│   └── api/
│       ├── admin/
│       │   └── chat-sessions/  # API quản lý phiên chat
│       └── chat/               # API xử lý tin nhắn chat
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx     # Layout cho trang admin
│   │   └── ChatNotifications.tsx # Thông báo chat mới
│   └── ChatBox/
│       └── ChatBox.tsx         # Component chatbox
├── hooks/
│   └── useChat.ts              # Hook xử lý logic chat
└── docs/
    └── CHAT-MANAGEMENT-GUIDE.md # Hướng dẫn sử dụng chi tiết
```

## Hướng dẫn sử dụng

### Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/ecommerce-ai.git
cd ecommerce-ai
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ứng dụng:
```bash
npm run dev
```

### Sử dụng ChatBox (Người dùng)

1. Truy cập trang web và nhấp vào biểu tượng chat ở góc dưới bên phải
2. Nhập tin nhắn hoặc chọn một trong các quick actions
3. Xem phản hồi từ trợ lý AI
4. Sử dụng các nút điều khiển để mở rộng, thu nhỏ hoặc xóa lịch sử chat

### Quản lý Trò chuyện (Quản trị viên)

1. Đăng nhập vào trang admin
2. Truy cập "Quản lý Trò chuyện" từ menu bên trái
3. Xem danh sách phiên trò chuyện và lọc theo trạng thái
4. Nhấp vào một phiên để xem lịch sử trò chuyện
5. Thay đổi trạng thái phiên (đóng/mở lại) khi cần thiết

## API Endpoints

### Chat API
- `POST /api/chat`: Gửi tin nhắn mới
- `POST /api/chat/session`: Tạo phiên chat mới
- `POST /api/chat/response`: Lưu tin nhắn trả lời từ assistant

### Admin API
- `GET /api/admin/chat-sessions`: Lấy danh sách phiên chat
- `GET /api/admin/chat-sessions/:id`: Lấy chi tiết phiên chat và lịch sử tin nhắn
- `PATCH /api/admin/chat-sessions/:id`: Cập nhật trạng thái phiên chat

## Cấu hình VNPay Sandbox

Hệ thống đã được cấu hình để sử dụng VNPay Sandbox cho thanh toán test:

### Thông tin Merchant
- **Terminal ID (TMN Code):** 1BB9SZY8
- **Secret Key:** SCZQJGDU1L7JSWQCNGF8Q0AMZBFPJ3VK
- **Payment URL:** https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
- **Merchant Portal:** https://sandbox.vnpayment.vn/merchantv2/
- **Test Login:** https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login

### Environment Variables
Thêm các biến môi trường sau vào file `.env`:

```env
# VNPay Sandbox Configuration
VNPAY_SANDBOX_TMN_CODE=1BB9SZY8
VNPAY_SANDBOX_HASH_SECRET=SCZQJGDU1L7JSWQCNGF8Q0AMZBFPJ3VK
VNPAY_RETURN_URL=http://localhost:3000/payment/result
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/vnpay-ipn
```

### Test VNPay Integration
Truy cập `/admin/vnpay-test` để test cấu hình và tạo thanh toán thử nghiệm.

### VNPay API Endpoints
- `POST /api/vnpay/create-payment-url`: Tạo URL thanh toán
- `GET /api/vnpay/vnpay-return`: Xử lý kết quả trả về từ VNPay
- `POST /api/vnpay/vnpay-ipn`: Xử lý thông báo thanh toán (IPN)
- `GET /api/vnpay/test-config`: Test cấu hình VNPay

## Lưu ý

- Hiện tại, hệ thống sử dụng bộ nhớ trong (in-memory) để lưu trữ dữ liệu. Trong môi trường production, nên sử dụng cơ sở dữ liệu để lưu trữ dữ liệu lâu dài.
- Chatbox hiện đang sử dụng các câu trả lời cố định. Để tăng tính tương tác, có thể tích hợp với các dịch vụ AI như OpenAI hoặc Google AI.
- VNPay hiện đang sử dụng môi trường Sandbox. Để chuyển sang Production, cần cập nhật thông tin merchant và URL tương ứng.

## Tài liệu chi tiết

Để biết thêm chi tiết về cách sử dụng hệ thống quản lý trò chuyện, vui lòng tham khảo [Hướng dẫn sử dụng hệ thống quản lý trò chuyện](./src/docs/CHAT-MANAGEMENT-GUIDE.md).