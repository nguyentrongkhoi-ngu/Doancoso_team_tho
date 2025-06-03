'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { customImageLoader, isValidURL } from '@/lib/imageLoader';

interface WishlistProduct {
  id: string;
  productId: string;
  addedAt: string;
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
    averageRating?: number;
  };
}

interface WishlistCardProps {
  product: WishlistProduct['product'];
  onRemove: () => void;
  onAddToCart: () => void;
  rating?: number;
}

interface ProductCardProps {
  product: any;
  onAddToWishlist: () => void;
  inWishlist: boolean;
}

const WishlistCard = ({ product, onRemove, onAddToCart, rating }: WishlistCardProps) => {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow h-full flex flex-col">
      <figure className="h-48 bg-base-200 flex-shrink-0 relative">
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

        {/* Stock badge */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Sắp hết
          </div>
        )}
      </figure>
      <div className="card-body p-4 flex-grow flex flex-col">
        <h2 className="card-title text-base line-clamp-2 min-h-[3rem]">{product.name}</h2>
        <p className="text-primary font-semibold mt-2">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.price)}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <button
            onClick={onAddToCart}
            className="btn btn-sm btn-primary"
          >
            Thêm vào giỏ
          </button>
          <button
            onClick={onRemove}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToWishlist, inWishlist }: ProductCardProps) => {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow h-full flex flex-col">
      <figure className="h-48 bg-base-200 flex-shrink-0 relative">
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

        {/* Stock badge */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Sắp hết
          </div>
        )}
      </figure>
      <div className="card-body p-4 flex-grow flex flex-col">
        <h2 className="card-title text-base line-clamp-2 min-h-[3rem]">{product.name}</h2>
        <p className="text-primary font-semibold mt-2">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.price)}
        </p>
        <div className="card-actions justify-end mt-auto">
          <Link href={`/products/${product.id}`} className="btn btn-sm btn-outline">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

interface WishlistSectionProps {
  onError: (message: string) => void;
  isStandalonePage?: boolean;
}

export default function WishlistSection({ onError, isStandalonePage = false }: WishlistSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  
  const isRecommendationsOnly = wishlistItems.length === 0;
  
  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wishlist');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách yêu thích');
      }
      
      const data = await response.json();
      setWishlistItems(data.wishlistItems || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách yêu thích:', error);
      onError('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRecommendations = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '6');
      
      const response = await fetch(`/api/recommendations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm gợi ý');
      }
      
      const data = await response.json();
      setRecommendedProducts(data.products || []);
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm gợi ý:', error);
    }
  };
  
  useEffect(() => {
    fetchWishlist();
    fetchRecommendations();
  }, []);
  
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setWishlistItems(current => 
        current.map(item => 
          item.product.id === productId 
            ? { ...item, isRemoving: true } 
            : item
        )
      );
      
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa sản phẩm khỏi danh sách yêu thích');
      }
      
      setWishlistItems(current => current.filter(item => item.product.id !== productId));
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi danh sách yêu thích:', error);
      onError('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
      
      setWishlistItems(current => 
        current.map(item => ({
          ...item,
          isRemoving: false,
        }))
      );
    }
  };
  
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
      
      alert('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
      onError('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }
  
  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-8">
        <div className={`text-center py-12 ${isStandalonePage ? 'bg-base-200 rounded-lg' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="mt-4 text-lg">
            {isStandalonePage 
              ? 'Danh sách yêu thích của bạn đang trống' 
              : 'Danh sách yêu thích của bạn đang trống'}
          </p>
          <Link href="/products" className="btn btn-primary mt-4">
            {isStandalonePage ? 'Khám phá sản phẩm' : 'Khám phá sản phẩm'}
          </Link>
        </div>
        
        {recommendedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Gợi ý cho bạn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendedProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow h-full flex flex-col">
                  <figure className="h-48 bg-base-200 flex-shrink-0 relative">
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

                    {/* Stock badge */}
                    {product.stock < 10 && product.stock > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        Sắp hết
                      </div>
                    )}
                  </figure>
                  <div className="card-body p-4 flex-grow flex flex-col">
                    <h2 className="card-title text-base line-clamp-2 min-h-[3rem]">{product.name}</h2>
                    <p className="text-primary font-semibold mt-2">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(product.price)}
                    </p>
                    <div className="card-actions justify-end mt-auto">
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
  
  return (
    <div className={`flex flex-col w-full ${isStandalonePage ? 'gap-12' : 'gap-8'}`}>
      <div className="flex justify-between items-center">
        {isStandalonePage ? (
          <h1 className="text-2xl font-bold">
            Danh sách yêu thích
            <span className="ml-2 text-sm font-normal text-base-content/70">
              ({wishlistItems.length} {wishlistItems.length > 1 ? 'sản phẩm' : 'sản phẩm'})
            </span>
          </h1>
        ) : (
          <h2 className="text-xl font-bold">Sản phẩm đã lưu</h2>
        )}
        
        {!isStandalonePage && wishlistItems.length > 0 && (
          <Link 
            href="/wishlist" 
            className="text-primary hover:underline text-sm flex items-center"
          >
            Xem tất cả
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        )}
      </div>

      {wishlistItems.length > 0 && (
        <div className={`grid ${isStandalonePage ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
          {(isStandalonePage ? wishlistItems : wishlistItems.slice(0, 2)).map((item) => (
            <WishlistCard
              key={item.id}
              product={item.product}
              onRemove={() => handleRemoveFromWishlist(item.id)}
              onAddToCart={() => handleAddToCart(item.product.id)}
              rating={item.product.averageRating}
            />
          ))}
        </div>
      )}

      {recommendedProducts.length > 0 && (
        <div className={`mt-${isRecommendationsOnly ? '0' : '8'}`}>
          <h2 className={`text-xl font-bold mb-6 ${isRecommendationsOnly && isStandalonePage ? 'text-center' : ''}`}>
            {isStandalonePage ? 'Sản phẩm gợi ý' : 'Gợi ý cho bạn'}
          </h2>
          <div className={`grid ${isStandalonePage ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
            {(isStandalonePage ? recommendedProducts : recommendedProducts.slice(0, 2)).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToWishlist={() => {}}
                inWishlist={wishlistItems.some(item => item.product.id === product.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 