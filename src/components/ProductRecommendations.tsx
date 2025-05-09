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

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        if (!session?.user) {
          // Nếu không có người dùng, lấy sản phẩm phổ biến
          const response = await fetch(`/api/products/popular?limit=${limit}`);
          if (response.ok) {
            const data = await response.json();
            setRecommendations({
              products: data,
              type: 'popular',
              reasons: data.reduce((acc: Record<string, string>, product: Product) => {
                acc[product.id] = 'Sản phẩm phổ biến';
                return acc;
              }, {})
            });
          }
          return;
        }

        // Tạo query string từ context
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
          setRecommendations(data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý sản phẩm:', error);
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