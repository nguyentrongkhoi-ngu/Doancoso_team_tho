'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowRightCircle, BadgePercent, Truck, CreditCard, RotateCcw, Clock4 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import các component với dynamic để tránh lỗi hydration
const FeaturedProducts = dynamic(() => import('../components/FeaturedProducts'), {
  ssr: false,
  loading: () => <ProductsSkeleton />
});

const SmartRecommendations = dynamic(() => import('../components/SmartRecommendations'), {
  ssr: false,
  loading: () => <ProductsSkeleton />
});

const FeaturedCategoriesComponent = dynamic(() => import('../components/FeaturedCategories'), {
  ssr: false,
  loading: () => <CategorySkeleton />
});

// Skeleton components
function ProductsSkeleton() {
  return (
    <div className="my-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-lg p-4">
            <div className="w-full h-40 bg-gray-200 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="my-12">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-xl overflow-hidden animate-pulse">
            <div className="w-full h-40 bg-gray-200 mb-3"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Banner carousel data
const bannerData = [
  {
    id: 1,
    title: "Sản phẩm cao cấp mới nhất",
    description: "Khám phá bộ sưu tập mùa hè với công nghệ AI gợi ý phù hợp",
    image: "/images/banner1.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1542291026-74b7b21026c4",
    cta: "Khám phá ngay",
    url: "/products",
    colorScheme: "from-indigo-600 to-violet-500"
  },
  {
    id: 2,
    title: "Đồng hồ thông minh giảm 30%",
    description: "Phong cách đỉnh cao, sức khỏe toàn diện",
    image: "/images/banner2.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    cta: "Mua ngay",
    url: "/products?category=smart-watches",
    colorScheme: "from-blue-600 to-cyan-400"
  },
  {
    id: 3,
    title: "Phụ kiện thời trang",
    description: "Được cá nhân hóa cho phong cách của bạn",
    image: "/images/banner3.jpg",
    fallbackImage: "https://images.unsplash.com/photo-1611930022073-84f7e4e4a204",
    cta: "Xem bộ sưu tập",
    url: "/products?category=accessories",
    colorScheme: "from-pink-500 to-rose-400"
  }
];

// Featured categories (backup - sẽ dùng component thay thế)
const categories = [
  { 
    id: 1, 
    name: "Điện thoại", 
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21026c4",
    slug: "phones" 
  },
  { 
    id: 2, 
    name: "Laptop", 
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    slug: "laptops" 
  },
  { 
    id: 3, 
    name: "Tai nghe", 
    image: "https://images.unsplash.com/photo-1545127398-14699f92334b",
    slug: "headphones" 
  },
  { 
    id: 4, 
    name: "Đồng hồ", 
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6",
    slug: "watches" 
  }
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Auto rotate banners
    const bannerInterval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % bannerData.length);
    }, 6000);
    
    return () => clearInterval(bannerInterval);
  }, []);

  useEffect(() => {
    if (searchParams && searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Ẩn thông báo sau 5 giây
      const timer = setTimeout(() => setShowPaymentSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="container mx-auto px-4">
      {showPaymentSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span>Thanh toán thành công! Hãy tiếp tục mua sắm.</span>
        </div>
      )}
      <ErrorBoundary fallback={<div>Đã xảy ra lỗi khi tải trang chủ</div>}>
        {/* Hero Banner Carousel */}
        <div className="relative w-full h-[70vh] mb-16 rounded-2xl overflow-hidden shadow-soft-xl">
          {bannerData.map((banner, index) => (
            <div 
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                currentBanner === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.colorScheme} opacity-90 z-10`}></div>
              <Image
                src={banner.fallbackImage}
                alt={banner.title}
                fill
                priority={index === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={currentBanner === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-xl"
                >
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-white text-xl mb-8 max-w-md">
                    {banner.description}
                  </p>
                  <Link
                    href={banner.url}
                    className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full inline-flex items-center gap-2 hover:bg-gray-100 hover:scale-105 transition-all duration-300"
                  >
                    {banner.cta}
                    <ArrowRightCircle className="h-5 w-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          ))}
          
          {/* Dots navigation */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
            {bannerData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentBanner === index 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Đến slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Featured Benefits */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { icon: <Truck className="h-8 w-8" />, title: "Giao hàng miễn phí", desc: "Cho đơn từ 500k" },
            { icon: <CreditCard className="h-8 w-8" />, title: "Thanh toán an toàn", desc: "Bảo mật 100%" },
            { icon: <RotateCcw className="h-8 w-8" />, title: "Đổi trả dễ dàng", desc: "Trong 14 ngày" },
            { icon: <Clock4 className="h-8 w-8" />, title: "Hỗ trợ 24/7", desc: "Liên hệ bất kỳ lúc nào" }
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-base-100 shadow-soft-md hover:shadow-soft-xl transition-shadow duration-300"
            >
              <div className="text-primary mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Categories */}
        <FeaturedCategoriesComponent />
        
        {/* Featured Products Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-16"
        >
          <FeaturedProducts />
        </motion.div>
        
        {/* Special Offer Banner */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="relative overflow-hidden rounded-2xl mb-16 shadow-soft-md"
        >
          <div className="bg-gradient-to-r from-primary to-accent py-12 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:w-2/3">
              <span className="inline-flex items-center gap-1 bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                <BadgePercent className="h-4 w-4" /> Ưu đãi đặc biệt
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Giảm giá tới 50% cho người dùng mới
              </h2>
              <p className="text-white/80 text-lg mb-6 max-w-lg">
                Đăng ký ngay hôm nay để nhận mã giảm giá đặc biệt và các gợi ý sản phẩm phù hợp với bạn.
              </p>
              <Link
                href="/register"
                className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-full inline-flex items-center gap-2 hover:gap-3 transition-all duration-300"
              >
                Đăng ký ngay <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <Image
                src="https://images.unsplash.com/photo-1607082349566-187342175e2f"
                alt="Special Offer"
                width={300}
                height={300}
                className="rounded-lg object-cover shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300"
              />
            </div>
          </div>
        </motion.div>
        
        {/* AI Recommendations Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <SmartRecommendations />
        </motion.div>
        
        {/* Testimonials or Trust Badges */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="py-16 px-8 bg-gray-50 rounded-2xl mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Khách hàng nói gì về chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Nguyễn Minh Tuấn",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                role: "Giám đốc kinh doanh",
                comment: "Tôi rất thích cách trang web gợi ý sản phẩm dựa trên sở thích của tôi. Đã tiết kiệm được rất nhiều thời gian tìm kiếm."
              },
              {
                name: "Trần Thị Hương",
                avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                role: "Chủ cửa hàng online",
                comment: "Giao diện đẹp, dễ sử dụng và giao hàng nhanh chóng. Đặc biệt ấn tượng với tính năng AI gợi ý sản phẩm."
              },
              {
                name: "Lê Hoàng Nam",
                avatar: "https://randomuser.me/api/portraits/men/67.jpg",
                role: "Quản lý bán hàng",
                comment: "Mua sắm trên đây là trải nghiệm tuyệt vời, từ đặt hàng đến giao hàng đều diễn ra nhanh chóng và chuyên nghiệp."
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-soft-md hover:shadow-soft-xl transition-shadow duration-300 testimonial-shine relative overflow-hidden"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 avatar-glow">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.comment}"</p>
                <div className="mt-4 flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </ErrorBoundary>
    </div>
  );
}
