'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { trackRecommendationClick } from '@/lib/recommendation-engine/client';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  category: {
    name: string;
  };
}

interface ProductRecommendationsProps {
  context?: {
    categoryId?: string;
    brandId?: string;
    searchQuery?: string;
    currentPage?: string;
    excludeProductId?: string;
  };
  title?: string;
  limit?: number;
  includeReasons?: boolean;
}

export default function ProductRecommendations({
  context,
  title = 'Sản phẩm đề xuất cho bạn',
  limit = 4,
  includeReasons = true
}: ProductRecommendationsProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<{
    products: Product[];
    type: string;
    reasons?: Record<string, string>;
  }>({ products: [], type: '', reasons: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Luôn thử lấy sản phẩm phổ biến trước
        // Tăng limit để có đủ sản phẩm sau khi lọc
        const fetchLimit = context?.excludeProductId ? limit + 2 : limit;
        const popularResponse = await fetch(`/api/products/popular?limit=${fetchLimit}`);
        if (popularResponse.ok) {
          let popularData = await popularResponse.json();

          // Lọc bỏ sản phẩm hiện tại nếu có
          if (context?.excludeProductId) {
            popularData = popularData.filter((product: Product) => product.id !== context.excludeProductId);
            // Cắt về đúng limit sau khi lọc
            popularData = popularData.slice(0, limit);
          }

          setRecommendations({
            products: popularData,
            type: 'popular',
            reasons: popularData.reduce((acc: Record<string, string>, product: Product) => {
              acc[product.id] = 'Sản phẩm phổ biến';
              return acc;
            }, {})
          });
        }

        // Nếu có session, thử lấy gợi ý cá nhân hóa
        if (session?.user) {
          try {
            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            params.append('includeReasons', includeReasons.toString());

            if (context) {
              Object.entries(context).forEach(([key, value]) => {
                if (value) {
                  params.append(key, value);
                }
              });
            }

            const response = await fetch(`/api/recommendations?${params.toString()}`);
            if (response.ok) {
              const data = await response.json();
              // Chỉ cập nhật nếu có dữ liệu tốt hơn
              if (data && Array.isArray(data) && data.length > 0) {
                setRecommendations({
                  products: data,
                  type: 'personalized',
                  reasons: data.reduce((acc: Record<string, string>, product: Product) => {
                    acc[product.id] = 'Gợi ý cho bạn';
                    return acc;
                  }, {})
                });
              }
            } else {
              console.warn('Personalized recommendations failed, using popular products');
            }
          } catch (personalizedError) {
            console.warn('Personalized recommendations error:', personalizedError);
            // Giữ nguyên sản phẩm phổ biến
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý sản phẩm:', error);
        setError('Không thể tải gợi ý sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session, context, limit, includeReasons]);

  const handleProductClick = (productId: string) => {
    if (session?.user?.id) {
      trackRecommendationClick(
        session.user.id,
        productId,
        recommendations.type
      );
    }
  };

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="bg-gray-100 animate-pulse rounded-md h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  // Hiển thị lỗi nếu có và không có sản phẩm nào
  if (error && recommendations.products.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 btn btn-sm btn-outline btn-error"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.products.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="relative aspect-square overflow-hidden rounded-md mb-2">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <h3 className="font-medium line-clamp-2 text-sm">{product.name}</h3>
            <div className="mt-1 flex flex-col">
              <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
              {includeReasons && recommendations.reasons && recommendations.reasons[product.id] && (
                <span className="text-xs text-gray-500 mt-1">
                  {recommendations.reasons[product.id]}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 