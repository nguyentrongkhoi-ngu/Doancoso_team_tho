'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/categories?includeStructure=true');
        setCategories(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-yellow-400 h-6 w-6" />
          Danh mục sản phẩm
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có danh mục nào
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCategoryClick(category.id)}
            >
              <figure className="h-48 overflow-hidden bg-gray-100">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={300}
                    height={200}
                    className="h-48 object-cover w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-200">
                    <span className="text-gray-400">Không có hình ảnh</span>
                  </div>
                )}
              </figure>
              <div className="card-body">
                <h2 className="card-title">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-500 line-clamp-2">{category.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  {category._count?.products || 0} sản phẩm
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.id);
                    }}
                  >
                    Xem sản phẩm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
