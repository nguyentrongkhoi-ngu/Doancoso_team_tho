'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';

// Import các component với dynamic để tránh lỗi hydration
const FeaturedProducts = dynamic(() => import('../components/FeaturedProducts'), {
  ssr: false,
  loading: () => <ProductsSkeleton />
});

const SmartRecommendations = dynamic(() => import('../components/SmartRecommendations'), {
  ssr: false,
  loading: () => <ProductsSkeleton />
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

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary fallback={<div>Đã xảy ra lỗi khi tải trang chủ</div>}>
        <div className="relative w-full h-[60vh] mb-8 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-900">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-8 md:p-16">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Khám phá bộ sưu tập mới
            </h1>
            <p className="text-white text-xl mb-6 max-w-md">
              Tìm kiếm sản phẩm phù hợp nhất với bạn
            </p>
            <button className="bg-white text-black font-bold py-3 px-6 rounded-full w-fit hover:bg-gray-100 transition-colors">
              Khám phá ngay
            </button>
          </div>
        </div>

        <style jsx global>{`
          .home-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
          }
        `}</style>
        
        <FeaturedProducts />
        
        <SmartRecommendations />
      </ErrorBoundary>
    </div>
  );
}
