import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Giới thiệu về chúng tôi
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Nền tảng thương mại điện tử thông minh với AI, mang đến trải nghiệm mua sắm tốt nhất cho khách hàng
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-lg text-gray-600">
                Chúng tôi cam kết mang đến trải nghiệm mua sắm trực tuyến tốt nhất thông qua việc ứng dụng công nghệ AI tiên tiến, 
                giúp khách hàng dễ dàng tìm kiếm và lựa chọn sản phẩm phù hợp với nhu cầu của mình.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
              <p className="text-lg text-gray-600">
                Trở thành nền tảng thương mại điện tử hàng đầu, tiên phong trong việc ứng dụng AI để cá nhân hóa trải nghiệm 
                mua sắm và tối ưu hóa quy trình kinh doanh cho đối tác.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Tính năng nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-blue-600 mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Recommendation</h3>
              <p className="text-gray-600">
                Hệ thống gợi ý sản phẩm thông minh dựa trên hành vi và sở thích của người dùng
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-blue-600 mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tùy chỉnh giao diện</h3>
              <p className="text-gray-600">
                Giao diện thân thiện, dễ sử dụng và tùy chỉnh theo nhu cầu của người dùng
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-blue-600 mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bảo mật cao</h3>
              <p className="text-gray-600">
                Hệ thống bảo mật đa lớp, đảm bảo an toàn cho thông tin và giao dịch của khách hàng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Sẵn sàng trải nghiệm?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Khám phá ngay các tính năng thông minh của chúng tôi
            </p>
            <Link 
              href="/products" 
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 