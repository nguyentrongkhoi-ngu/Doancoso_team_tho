'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function RecommendationInfo() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Hệ thống gợi ý thông minh</h1>
      
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
            AI
          </div>
          <h2 className="text-2xl font-bold">Gợi ý sản phẩm được cá nhân hóa</h2>
        </div>
        
        <p className="text-gray-700 mb-8">
          Chúng tôi sử dụng công nghệ AI (Trí tuệ nhân tạo) để phân tích hành vi mua sắm của bạn và gợi ý những sản phẩm
          phù hợp nhất với sở thích cá nhân. Hệ thống của chúng tôi hoàn toàn tôn trọng quyền riêng tư của bạn và không 
          sử dụng dữ liệu của bạn cho bất kỳ mục đích nào khác ngoài việc cải thiện trải nghiệm mua sắm.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-primary-600">Cách hệ thống hoạt động</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Phân tích các sản phẩm bạn đã xem</li>
              <li>Theo dõi lịch sử tìm kiếm của bạn</li>
              <li>Ghi nhận thời gian bạn dành cho từng sản phẩm</li>
              <li>Học từ hành vi mua hàng trước đây</li>
              <li>Kết hợp với xu hướng chung của người dùng tương tự</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-primary-600">Lợi ích cho bạn</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Tiết kiệm thời gian tìm kiếm sản phẩm</li>
              <li>Khám phá các sản phẩm phù hợp với sở thích</li>
              <li>Không bỏ lỡ các sản phẩm mới liên quan</li>
              <li>Tìm thấy sản phẩm tương tự đã xem trước đó</li>
              <li>Trải nghiệm mua sắm được cá nhân hóa hoàn toàn</li>
            </ul>
          </div>
        </div>
        
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">Các loại gợi ý bạn sẽ thấy</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-24 bg-blue-100 rounded-md flex items-center justify-center mb-4">
                <span className="text-blue-700 font-bold text-lg">Cá nhân hóa</span>
              </div>
              <h4 className="font-semibold mb-2">Dựa trên sở thích của bạn</h4>
              <p className="text-gray-600 text-sm">Dựa trên những sản phẩm bạn đã xem, tìm kiếm và mua sắm trước đây.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-24 bg-green-100 rounded-md flex items-center justify-center mb-4">
                <span className="text-green-700 font-bold text-lg">Danh mục</span>
              </div>
              <h4 className="font-semibold mb-2">Theo danh mục yêu thích</h4>
              <p className="text-gray-600 text-sm">Sản phẩm trong các danh mục bạn thường xuyên quan tâm nhất.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="h-24 bg-yellow-100 rounded-md flex items-center justify-center mb-4">
                <span className="text-yellow-700 font-bold text-lg">Phổ biến</span>
              </div>
              <h4 className="font-semibold mb-2">Sản phẩm được ưa chuộng</h4>
              <p className="text-gray-600 text-sm">Sản phẩm phổ biến nhất được nhiều người dùng quan tâm.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
          <h3 className="text-xl font-semibold mb-3 text-blue-700">Bảo mật và quyền riêng tư</h3>
          <p className="text-gray-700 mb-4">
            Chúng tôi cam kết bảo vệ dữ liệu của bạn. Toàn bộ việc phân tích hành vi người dùng được thực hiện
            trên máy chủ của chúng tôi với các tiêu chuẩn bảo mật cao nhất. Chúng tôi không chia sẻ dữ liệu này 
            với bất kỳ bên thứ ba nào.
          </p>
          <p className="text-gray-700">
            Bạn có thể tìm hiểu thêm trong <Link href="/privacy-policy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link> của chúng tôi.
          </p>
        </div>
        
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Bắt đầu mua sắm với gợi ý thông minh
          </Link>
        </div>
      </div>
    </div>
  );
} 