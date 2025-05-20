'use client';

import { FC } from 'react';
import Link from 'next/link';

const AboutPage: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">Về Chúng Tôi</h1>
          <p className="mt-4 text-lg text-gray-600">Hiểu thêm về đội ngũ và sứ mệnh của chúng tôi</p>
        </div>
        
        <div className="bg-gray-50 shadow-inner rounded-lg p-8 mb-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Giới Thiệu</h2>
          <p className="text-gray-700 leading-relaxed">
            Chúng tôi là một đội ngũ chuyên nghiệp, đam mê công nghệ và luôn tìm kiếm những giải pháp sáng tạo.
            Với nhiều năm kinh nghiệm trong lĩnh vực, chúng tôi tự hào mang đến những sản phẩm và dịch vụ tốt nhất,
            đáp ứng nhu cầu đa dạng của khách hàng. Mục tiêu của chúng tôi không chỉ là kinh doanh, mà còn là
            xây dựng một cộng đồng vững mạnh và góp phần vào sự phát triển chung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div className="bg-white shadow-lg rounded-lg p-8 border border-blue-100 transform transition duration-300 hover:scale-105">
            <h2 className="text-3xl font-bold text-blue-700 mb-4">Sứ Mệnh</h2>
            <p className="text-gray-700 leading-relaxed">
              Sứ mệnh của chúng tôi là tạo ra những sản phẩm công nghệ đột phá, mang lại giá trị thiết thực
              cho người dùng. Chúng tôi cam kết về chất lượng, đổi mới không ngừng và luôn đặt khách hàng
              làm trung tâm trong mọi hoạt động.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-8 border border-green-100 transform transition duration-300 hover:scale-105">
            <h2 className="text-3xl font-bold text-green-700 mb-4">Tầm Nhìn</h2>
            <p className="text-gray-700 leading-relaxed">
              Chúng tôi hướng tới trở thành đơn vị tiên phong trong lĩnh vực, được công nhận về sự xuất sắc
              và đóng góp tích cực cho xã hội. Luôn đón đầu xu hướng công nghệ và mở rộng thị trường để
              phục vụ nhiều khách hàng hơn nữa.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 shadow-inner rounded-lg p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Liên Hệ</h2>
          <div className="text-gray-700 leading-relaxed">
            <p className="mb-3"><strong>Email:</strong> contact@example.com</p>
            <p className="mb-3"><strong>Điện thoại:</strong> (123) 456-7890</p>
            <p><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/products" legacyBehavior>
            <a className="inline-block bg-blue-600 text-white text-xl font-semibold py-4 px-10 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105">
              Xem Sản Phẩm Của Chúng Tôi
            </a>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AboutPage; 