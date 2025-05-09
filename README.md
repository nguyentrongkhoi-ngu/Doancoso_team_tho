# E-Commerce AI - Website Bán hàng Thông minh

![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=for-the-badge&logo=next.js&labelColor=000000)
![Typescript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

Website bán hàng hiện đại có tích hợp AI nhằm mang lại trải nghiệm mua sắm cá nhân hóa thông qua hệ thống gợi ý sản phẩm thông minh và tính năng tối ưu hóa hiệu suất.

## ✨ Tính năng chính

- 🔍 **Tìm kiếm thông minh**: Tìm kiếm sản phẩm nhanh chóng với gợi ý tìm kiếm và sửa lỗi chính tả tự động
- 🤖 **Gợi ý sản phẩm bằng AI**: Hệ thống gợi ý lai (hybrid) kết hợp nhiều thuật toán AI tiên tiến
- 📊 **Dashboard quản trị**: Theo dõi hiệu quả bán hàng và phân tích hành vi người dùng
- 🛒 **Giỏ hàng và thanh toán**: Quy trình mua hàng đơn giản và linh hoạt
- 👤 **Quản lý tài khoản**: Đăng ký, đăng nhập và quản lý thông tin cá nhân
- 📱 **Thiết kế responsive**: Trải nghiệm mượt mà trên mọi thiết bị

## 🧠 Công nghệ AI

Website sử dụng nhiều công nghệ AI tiên tiến:

- **TensorFlow.js**: Deep learning trên trình duyệt cho phân tích hành vi người dùng
- **Hybrid Recommender System**: Kết hợp nhiều thuật toán gợi ý (collaborative, content-based, matrix factorization)
- **A/B Testing tự động**: Tối ưu hóa trải nghiệm người dùng qua phân tích dữ liệu
- **Phân tích hành vi người dùng**: Theo dõi và phân tích cách người dùng tương tác với website

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI & Machine Learning**: TensorFlow.js, Recommendation Algorithms
- **Authentication**: NextAuth.js
- **Payment**: Stripe API
- **Deployment**: Vercel

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js 18.0.0 trở lên
- npm hoặc yarn
- PostgreSQL

### Cài đặt

1. **Clone repository**
```bash
git clone https://github.com/your-username/ecommerce-ai.git
cd ecommerce-ai
```

2. **Cài đặt dependencies**
```bash
npm install
# hoặc
yarn install
```

3. **Cấu hình biến môi trường**
```bash
cp .env.example .env.local
```
Chỉnh sửa file `.env.local` với các thông tin cấu hình của bạn.

4. **Khởi tạo database**
```bash
npx prisma migrate dev
```

5. **Chạy dự án ở môi trường development**
```bash
npm run dev
# hoặc
yarn dev
```

Dự án sẽ chạy tại `http://localhost:3000`

## 📚 Tài liệu

- [Tài liệu về hệ thống gợi ý AI](./docs/AI-RECOMMENDATION-SYSTEM.md)
- [Hướng dẫn quản trị](./docs/ADMIN-GUIDE.md)
- [API Documentation](./docs/API-DOCS.md)

## 📦 Cấu trúc dự án

```
ecommerce-ai/
├── prisma/               # Prisma schema và migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API endpoints
│   │   ├── admin/        # Admin pages
│   │   ├── (shop)/       # Shop pages 
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and libraries
│   │   ├── recommendation-engine/  # AI recommendation modules
│   │   ├── prisma/       # Prisma client
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript type definitions
├── docs/                 # Documentation
├── .env.example          # Example environment variables
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## 🛣️ Lộ trình phát triển

- [x] Xây dựng cấu trúc cơ bản website
- [x] Tích hợp Prisma và thiết kế database
- [x] Phát triển các trang chính (trang chủ, chi tiết sản phẩm, giỏ hàng)
- [x] Tích hợp NextAuth cho đăng nhập/đăng ký
- [x] Tích hợp TensorFlow.js cho hệ thống gợi ý
- [x] Phát triển Hybrid Recommendation System
- [x] Tạo trang quản trị và dashboard
- [x] Tích hợp API thanh toán (Stripe)
- [x] Tạo hệ thống báo cáo và phân tích dữ liệu
- [ ] Tối ưu hóa hiệu suất và SEO
- [ ] Triển khai lên môi trường production

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tham khảo [CONTRIBUTING.md](./CONTRIBUTING.md) để biết thêm chi tiết về cách đóng góp cho dự án.

## 📝 Giấy phép

Dự án này được cấp phép theo giấy phép MIT. Xem [LICENSE](./LICENSE) để biết thêm chi tiết.

## 📧 Liên hệ

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:

- Email: example@email.com
- Website: https://example.com
- GitHub: [your-username](https://github.com/your-username) 