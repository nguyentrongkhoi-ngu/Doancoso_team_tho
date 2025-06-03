'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { InformationCircleIcon, ShoppingCartIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function SmartRecommendations() {
  // Add session check
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';
  
  const { 
    recommendations, 
    loading, 
    error, 
    getRecommendationTitle, 
    getRecommendationDescription,
    logInteraction
  } = useSmartRecommendations({
    limit: 8,
    includeReasons: true,
    filterInteracted: true
  });
  
  // State cho sản phẩm hover
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Xử lý khi click vào sản phẩm
  const handleProductClick = useCallback((productId: string) => {
    // Ghi lại thông tin click vào sản phẩm được gợi ý
    logInteraction(productId, 'view');
  }, [logInteraction]);
  
  // Xử lý khi thêm vào giỏ hàng
  const handleAddToCart = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault(); // Ngăn chặn navigation
    e.stopPropagation(); // Ngăn chặn bubbling
    logInteraction(productId, 'cart');
    // TODO: Thêm logic thêm vào giỏ hàng thực tế ở đây
  }, [logInteraction]);
  
  // Xử lý hover vào sản phẩm
  const handleProductHover = useCallback((productId: string | null) => {
    setHoveredProduct(productId);
  }, []);

  // Check if user is not authenticated
  if (!isAuthenticated && authStatus !== 'loading') {
    return (
      <div className="my-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lưu ý: </strong>
          <span className="block sm:inline">Vui lòng đăng nhập để xem gợi ý sản phẩm phù hợp với bạn.</span>
        </div>
      </div>
    );
  }

  if (loading || authStatus === 'loading') {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Đang tải gợi ý sản phẩm...</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse h-full flex flex-col">
              <div className="w-full h-48 bg-gray-200 rounded-md mb-2 flex-shrink-0"></div>
              <div className="flex-grow flex flex-col">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Không có gợi ý sản phẩm</h2>
        <p className="text-gray-500">Hãy xem nhiều sản phẩm hơn để nhận được gợi ý phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="my-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{getRecommendationTitle()}</h2>
            <Link href="/recommendation-info" className="text-gray-500 hover:text-primary-600 transition-colors">
              <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          {getRecommendationDescription() && (
            <p className="text-gray-500 text-sm mt-1">{getRecommendationDescription()}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="group relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col"
            onMouseEnter={() => handleProductHover(product.id)}
            onMouseLeave={() => handleProductHover(null)}
          >
            <Link
              href={`/products/${product.id}`}
              className="block h-full flex flex-col"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative w-full pt-[100%] overflow-hidden bg-gray-100 flex-shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover absolute inset-0 transform transition-transform duration-500 ${
                      hoveredProduct === product.id ? 'scale-110' : 'scale-100'
                    }`}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">Chưa có ảnh</span>
                  </div>
                )}
                
                {/* Badge khuyến mãi (tùy chọn) */}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    Hot
                  </div>
                )}

                {/* Stock badge */}
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                    Sắp hết
                  </div>
                )}
                
                {/* Quick action buttons */}
                <div className={`absolute bottom-2 right-2 flex flex-col gap-2 transition-opacity duration-200 ${
                  hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button 
                    className="p-2 bg-white rounded-full shadow-md hover:bg-primary-50 transition-colors"
                    onClick={(e) => handleAddToCart(e, product.id)}
                    title="Thêm vào giỏ hàng"
                  >
                    <ShoppingCartIcon className="h-5 w-5 text-primary-600" />
                  </button>
                  <button 
                    className="p-2 bg-white rounded-full shadow-md hover:bg-primary-50 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: Thêm logic wishlist ở đây
                    }}
                    title="Thêm vào danh sách yêu thích"
                  >
                    <HeartIcon className="h-5 w-5 text-primary-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[3rem] mb-1">{product.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-1">{product.category.name}</p>
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-primary-600 font-bold">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(product.price)}
                  </p>
                  <div className="flex items-center text-amber-500">
                    <span className="text-xs mr-1">4.5</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-xs ${star <= 4 ? 'text-amber-500' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>★ Gợi ý thông minh dựa trên phân tích nâng cao</span>
          <Link 
            href="/recommendation-info" 
            className="text-primary-600 hover:underline"
          >
            Tìm hiểu thêm
          </Link>
        </div>
        <Link 
          href="/products" 
          className="text-sm text-primary-600 hover:underline font-medium"
        >
          Xem tất cả sản phẩm →
        </Link>
      </div>
    </div>
  );
} 