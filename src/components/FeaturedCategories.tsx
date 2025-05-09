'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Định nghĩa kiểu dữ liệu cho danh mục
type Category = {
  id: string;
  name: string;
  imageUrl?: string;
  productCount?: number;
};

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories?featured=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        let data = await response.json();
        
        // Nếu không có danh mục nào, tạo danh mục mẫu
        if (!data || data.length === 0) {
          console.log('No categories found, creating fallback categories');
          data = getFallbackCategories();
        }
        
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Không thể tải danh mục sản phẩm');
        // Sử dụng dữ liệu mẫu khi có lỗi
        setCategories(getFallbackCategories());
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Tạo danh mục mẫu khi API bị lỗi
  const getFallbackCategories = (): Category[] => {
    const defaultCategories = [
      { id: 'smartphone', name: 'Điện thoại' },
      { id: 'laptop', name: 'Laptop' },
      { id: 'tablet', name: 'Máy tính bảng' },
      { id: 'smartwatch', name: 'Đồng hồ thông minh' },
      { id: 'audio', name: 'Âm thanh' },
      { id: 'accessory', name: 'Phụ kiện' }
    ];
    
    // Thêm hình ảnh và số lượng sản phẩm mẫu
    return defaultCategories.map(category => ({
      ...category,
      imageUrl: `https://via.placeholder.com/800x600?text=${encodeURIComponent(category.name)}`,
      productCount: Math.floor(Math.random() * 100) + 20
    }));
  };

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return <p className="text-red-500 my-4">{error}</p>;
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Danh mục sản phẩm</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            href={`/products?category=${category.id}`}
            key={category.id}
            className="group flex flex-col items-center text-center p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative w-full h-36 mb-2 bg-gray-50 rounded overflow-hidden">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback cho hình ảnh lỗi
                    e.currentTarget.src = `https://via.placeholder.com/800x600?text=${encodeURIComponent(category.name)}`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <span>{category.name}</span>
                </div>
              )}
            </div>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            {category.productCount !== undefined && (
              <p className="text-sm text-gray-500 mt-1">{category.productCount} sản phẩm</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
} 