'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { customImageLoader, isValidURL } from '@/lib/imageLoader';

interface RecentlyViewedProduct {
  viewId: string;
  productId: string;
  viewCount: number;
  lastViewed: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
    category: {
      id: string;
      name: string;
    };
    averageRating: number;
  };
}

interface RecentlyViewedSectionProps {
  onError: (message: string) => void;
}

export default function RecentlyViewedSection({ onError }: RecentlyViewedSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  
  const fetchRecentlyViewed = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recently-viewed?limit=12');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách sản phẩm đã xem');
      }
      
      const data = await response.json();
      setRecentlyViewed(data.recentlyViewed || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm đã xem:', error);
      onError('Không thể tải danh sách sản phẩm đã xem. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRecommendations = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '3');
      
      const response = await fetch(`/api/recommendations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm gợi ý');
      }
      
      const data = await response.json();
      setRecommendedProducts(data.products || []);
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm gợi ý:', error);
      // Không hiển thị lỗi cho người dùng vì đây không phải tính năng chính
    }
  };
  
  useEffect(() => {
    fetchRecentlyViewed();
    fetchRecommendations();
  }, []);
  
  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể thêm vào giỏ hàng');
      }
      
      // Hiển thị thông báo thành công
      alert('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
      onError('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.');
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 30) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };
  
  // Hiển thị loading
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4">Đang tải danh sách sản phẩm đã xem...</p>
      </div>
    );
  }
  
  // Hiển thị danh sách trống
  if (recentlyViewed.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="mt-4 text-lg">Bạn chưa xem sản phẩm nào gần đây</p>
          <Link href="/products" className="btn btn-primary mt-4">
            Khám phá sản phẩm
          </Link>
        </div>
        
        {recommendedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Gợi ý cho bạn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendedProducts.map((product) => (
                <div key={product.id} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
                  <figure className="h-48 bg-base-200">
                    {product.imageUrl && isValidURL(product.imageUrl) ? (
                      <Image 
                        loader={customImageLoader}
                        src={product.imageUrl}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </figure>
                  <div className="card-body p-4">
                    <h2 className="card-title text-base">{product.name}</h2>
                    <p className="text-primary font-semibold">
                      {new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                      }).format(product.price)}
                    </p>
                    <div className="card-actions justify-end mt-2">
                      <Link href={`/products/${product.id}`} className="btn btn-sm btn-outline">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Hiển thị danh sách sản phẩm đã xem
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Sản phẩm đã xem gần đây</h2>
        <button 
          className="btn btn-sm btn-ghost"
          onClick={fetchRecentlyViewed}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recentlyViewed.map((item) => (
          <div 
            key={item.viewId} 
            className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
          >
            <figure className="h-40 bg-base-200 relative">
              {item.product.imageUrl && isValidURL(item.product.imageUrl) ? (
                <Link href={`/products/${item.product.id}`}>
                  <Image 
                    loader={customImageLoader}
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </Link>
              ) : (
                <Link href={`/products/${item.product.id}`} className="flex items-center justify-center w-full h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
              )}

              {/* Stock badge */}
              {item.product.stock < 10 && item.product.stock > 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  Sắp hết
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1">
                {formatTimeAgo(item.lastViewed)}
                {item.viewCount > 1 && (
                  <span className="ml-1 badge badge-xs badge-primary">{item.viewCount}x</span>
                )}
              </div>
            </figure>
            <div className="card-body p-3">
              <Link href={`/products/${item.product.id}`}>
                <h3 className="font-medium text-sm line-clamp-2 hover:text-primary">{item.product.name}</h3>
              </Link>
              <p className="text-primary font-semibold text-sm mt-1">
                {new Intl.NumberFormat('vi-VN', { 
                  style: 'currency', 
                  currency: 'VND' 
                }).format(item.product.price)}
              </p>
              <div className="card-actions justify-end mt-2">
                <button 
                  className="btn btn-xs btn-primary w-full"
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={item.product.stock === 0}
                >
                  {item.product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Phản hồi gợi ý */}
      <div className="mt-8 bg-base-200 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Cải thiện gợi ý sản phẩm</h3>
        <p className="text-sm mb-4">Sản phẩm gợi ý cho bạn có phù hợp không?</p>
        <div className="flex space-x-2">
          <button className="btn btn-sm btn-outline gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Có, tôi thích
          </button>
          <button className="btn btn-sm btn-outline gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m-7 0H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Không phù hợp
          </button>
        </div>
      </div>
    </div>
  );
} 