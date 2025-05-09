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
      className={`group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      <div className="relative w-full h-48">
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
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {/* Wishlist button */}
        <div className="absolute top-2 right-2">
          <WishlistButton 
            productId={product.id} 
            className="btn-sm btn-circle"
          />
        </div>
        
        {/* Stock badge */}
        {product.stock <= 10 && (
          <div className="absolute top-2 left-2 badge badge-error text-white">
            Còn {product.stock}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 truncate">{product.category.name}</p>
        <p className="text-primary-600 font-bold mt-2">
          {formatPrice(product.price)}
        </p>
        
        {/* Rating if available */}
        {product.averageRating !== undefined && (
          <div className="flex items-center gap-1 mt-1">
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
            <span className="text-xs">({product.averageRating.toFixed(1)})</span>
          </div>
        )}
        
        {/* Hiển thị trạng thái sản phẩm */}
        {product.stock > 0 ? (
          <span className="badge badge-success">Còn hàng</span>
        ) : (
          <span className="badge badge-error">Hết hàng</span>
        )}
        
        <div className="card-actions justify-end mt-2">
          <button 
            className={`btn btn-primary btn-sm ${isLoading ? 'loading' : ''}`} 
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