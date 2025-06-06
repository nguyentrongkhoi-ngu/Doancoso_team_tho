'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/context/CategoriesContext';
import { ArrowRight, Sparkles, ImageIcon, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

// Định nghĩa kiểu dữ liệu cho danh mục
type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  productCount?: number;
};

export default function FeaturedCategories() {
  const { featuredCategories, loading: categoriesLoading } = useCategories();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';

  // Sử dụng categories từ Context và fallback nếu cần
  useEffect(() => {
    if (!categoriesLoading) {
      if (featuredCategories.length === 0) {
        console.log('No featured categories found, creating fallback categories');
        // Có thể set fallback categories nếu cần
      }
      setLoading(false);
    }
  }, [categoriesLoading, featuredCategories]);

  // Tạo danh mục mẫu khi API bị lỗi
  const getFallbackCategories = (): Category[] => {
    const defaultCategories = [
      { id: 'smartphone', name: 'Điện thoại', description: 'Khám phá các mẫu điện thoại mới nhất' },
      { id: 'laptop', name: 'Laptop', description: 'Laptop mạnh mẽ cho công việc và giải trí' },
      { id: 'tablet', name: 'Máy tính bảng', description: 'Màn hình lớn, trải nghiệm tuyệt vời' },
      { id: 'smartwatch', name: 'Đồng hồ thông minh', description: 'Theo dõi sức khỏe và kết nối liền mạch' },
      { id: 'audio', name: 'Âm thanh', description: 'Âm thanh sống động, chất lượng cao' },
      { id: 'accessory', name: 'Phụ kiện', description: 'Phụ kiện thông minh cho thiết bị của bạn' }
    ];

    // Thêm hình ảnh và số lượng sản phẩm mẫu
    return defaultCategories.map(category => ({
      ...category,
      imageUrl: `https://via.placeholder.com/800x600?text=${encodeURIComponent(category.name)}`,
      productCount: Math.floor(Math.random() * 100) + 20
    }));
  };

  // Hàm xử lý lỗi hình ảnh
  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <div className="my-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-5 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && featuredCategories.length === 0) {
    return <p className="text-red-500 my-4">{error}</p>;
  }

  if (!featuredCategories.length) {
    return null;
  }

  return (
    <motion.div
      className="my-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-yellow-400 h-6 w-6" />
          Danh mục nổi bật
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/categories"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Quản lý danh mục"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/products"
            className="text-primary-600 inline-flex items-center gap-1 font-medium hover:underline transition-colors"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {featuredCategories.map((category) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            className="group"
          >
            <Link
              href={`/products?category=${category.id}`}
              className="block rounded-xl bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-300 h-full"
            >
              {/* Bỏ hình ảnh minh họa cho danh mục */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                )}
                {category.productCount !== undefined && category.productCount > 0 && (
                  <p className="text-sm font-medium text-primary-600 mt-2">{category.productCount} sản phẩm</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}