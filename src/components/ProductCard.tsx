'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartProvider';
import WishlistButton from './WishlistButton';
import { isValidURL, customImageLoader } from '@/lib/imageLoader';
import { useTracking } from '@/hooks/useTracking';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  category: Category;
  averageRating?: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({ product, className = '', priority = false }: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { trackProductClick, trackAddToCart } = useTracking();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn không cho link chuyển trang
    e.stopPropagation(); // Ngăn không cho sự kiện lan ra elements cha
    
    if (!session) {
      router.push('/login?redirect=/cart');
      return;
    }
    
    setIsLoading(true);
    try {
      await addToCart(product.id, 1);
      // Theo dõi hành vi thêm vào giỏ hàng
      trackAddToCart(product.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Theo dõi khi người dùng click vào sản phẩm
    trackProductClick(product.id);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      onClick={handleClick}
      className={`group block bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300 h-full ${className}`}
    >
      {/* Image Container */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-50">
        {product.imageUrl && isValidURL(product.imageUrl) ? (
          <Image
            loader={customImageLoader}
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-400 text-sm">Chưa có ảnh</span>
            </div>
          </div>
        )}

        {/* Wishlist button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <WishlistButton
            productId={product.id}
            className="btn btn-circle btn-sm bg-white/80 backdrop-blur-sm border-0 hover:bg-white shadow-lg"
          />
        </div>

        {/* Stock badge */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Sắp hết
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white px-3 py-1 rounded-full text-gray-800 font-semibold text-sm">Hết hàng</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Product Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-purple-600 transition-colors duration-300">
          {product.name}
        </h3>

        {/* Category */}
        <p className="text-gray-500 text-sm mt-1 line-clamp-1">
          {product.category.name}
        </p>

        {/* Rating */}
        {product.averageRating !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <div className="rating rating-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <input
                  key={star}
                  type="radio"
                  name={`rating-${product.id}`}
                  className="mask mask-star-2 bg-orange-400"
                  checked={Math.round(product.averageRating || 0) === star}
                  readOnly
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">({product.averageRating.toFixed(1)})</span>
          </div>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-purple-600 mt-2">
          {formatPrice(product.price)}
        </p>

        {/* Stock Status */}
        <div className="mt-2">
          {product.stock > 0 ? (
            <span className="badge badge-success badge-sm">Còn hàng</span>
          ) : (
            <span className="badge badge-error badge-sm">Hết hàng</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto pt-3">
          <button
            className={`btn btn-sm w-full ${
              product.stock > 0
                ? 'btn-primary'
                : 'btn-disabled'
            } ${isLoading ? 'loading' : ''}`}
            onClick={handleAddToCart}
            disabled={isLoading || product.stock <= 0}
          >
            {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
          </button>
        </div>
      </div>
    </Link>
  );
} 