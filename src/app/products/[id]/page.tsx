'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import React from 'react';
import useUserBehavior from '@/hooks/useUserBehavior';
import ProductRecommendations from '@/components/ProductRecommendations';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProductImageSlider from '@/components/ProductImageSlider';
import ProductReviews from '@/components/ProductReviews';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import AvatarPlaceholder from '@/components/AvatarPlaceholder';
import { isValidURL, customImageLoader } from '@/lib/imageLoader';
import OrderDetails from '@/components/OrderDetails';
import { formatDistanceToNow, parseISO, format, subMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import WishlistButton from '@/components/WishlistButton';
import { useTracking } from '@/hooks/useTracking';
import ProductDetail from '@/components/ProductDetail';
import RelatedProducts from '@/components/RelatedProducts';
import Loading from '@/components/Loading';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useCurrentProduct } from '@/context/ProductContext';

interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  images: ProductImage[];
  category: {
    id: string;
    name: string;
  };
}

// Main product page component that extracts ID from the URL path
export default function ProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { trackProductView } = useTracking();
  const { addToCart } = useCart();
  const { setCurrentProduct } = useCurrentProduct();
  
  // Get the product ID from the URL path instead of params
  const pathname = usePathname();
  const productId = pathname ? pathname.split('/').pop() || '' : '';
  
  // Prepare safe product ID (trim any whitespace)
  const safeProductId = productId && typeof productId === 'string' ? productId.trim() : '';

  // Để theo dõi thời gian xem sản phẩm
  const [viewStartTime, setViewStartTime] = useState<number>(0);

  // Lấy thông tin sản phẩm và theo dõi hành vi xem
  useEffect(() => {
    if (!safeProductId) return;
    
    // Biến lưu trữ timer
    let trackingTimer: NodeJS.Timeout | null = null;
    
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/products/${safeProductId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Sản phẩm không tồn tại hoặc đã bị xóa.');
            router.push('/404');
            return;
          }
          throw new Error('Không thể tải thông tin sản phẩm.');
        }
        
        const data = await response.json();
        setProduct(data);
        
        // Cập nhật thông tin sản phẩm hiện tại vào context
        setCurrentProduct(data);
        
        // Bắt đầu theo dõi thời gian xem
        setViewStartTime(Date.now());
        
        // Ghi lại hành vi xem sản phẩm sau 3 giây để đảm bảo người dùng thực sự đang xem
        trackingTimer = setTimeout(() => {
          trackProductView(safeProductId);
        }, 3000);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Có lỗi xảy ra khi tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
    
    // Cleanup function khi component unmount
    return () => {
      // Xóa bỏ các timer
      clearTimeout(trackingTimer);
      
      // Khi component unmount, ghi lại thời gian xem sản phẩm
      if (viewStartTime > 0 && safeProductId) {
        const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000); // Đổi sang giây
        if (viewDuration >= 5) { // Chỉ ghi lại nếu xem ít nhất 5 giây
          trackProductView(safeProductId, viewDuration);
        }
      }
    };
  }, [safeProductId, trackProductView, router, setCurrentProduct]);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!session) {
      // Lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
      if (product) {
        localStorage.setItem('pendingCartItem', JSON.stringify({
          productId: safeProductId,
          name: product.name,
          quantity: quantity
        }));
      }
      
      router.push('/login?redirectTo=' + encodeURIComponent(`/products/${safeProductId}`));
      return;
    }

    try {
      await addToCart(safeProductId, quantity);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (err: any) {
      console.error('Lỗi khi thêm vào giỏ hàng:', err);
      
      // Kiểm tra lỗi phiên đăng nhập
      if (err.message && (
          err.message.includes('đăng nhập') || 
          err.message.includes('phiên')
        )) {
        toast.error('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
        if (product) {
          localStorage.setItem('pendingCartItem', JSON.stringify({
            productId: safeProductId,
            name: product.name,
            quantity: quantity
          }));
        }
        
        // Chuyển đến trang đăng nhập
        setTimeout(() => {
          router.push(`/login?redirectTo=${encodeURIComponent(`/products/${safeProductId}`)}`);
        }, 1500);
      } else {
        toast.error(err.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'Không tìm thấy sản phẩm'}</span>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button onClick={() => router.back()} className="btn btn-outline">
            Quay lại
          </button>
          <button onClick={() => router.push('/products')} className="btn btn-primary">
            Xem tất cả sản phẩm
          </button>
        </div>
        
        <div className="mt-8 w-full">
          <h2 className="text-xl font-semibold mb-4">Có thể bạn quan tâm</h2>
          <ErrorBoundary fallback={<div className="alert alert-info">Không thể tải gợi ý sản phẩm.</div>}>
            <ProductRecommendations />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Prepare images for the slider
  const productImages = product.images && product.images.length > 0
    ? product.images.map(img => img.imageUrl)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  return (
    <div className="space-y-8">
      <nav className="text-sm breadcrumbs">
        <ul>
          <li><a href="/">Trang chủ</a></li>
          <li><a href="/products">Sản phẩm</a></li>
          <li><a href={`/categories/${product.category.id}`}>{product.category.name}</a></li>
          <li>{product.name}</li>
        </ul>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hình ảnh sản phẩm - Đã thay thế bằng image slider */}
        <ProductImageSlider images={productImages} productName={product.name} />
        
        {/* Thông tin sản phẩm */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="badge badge-secondary">{product.category.name}</div>
          
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </p>
          
          <div className="divider"></div>
          
          <div className="prose">
            <p>{product.description || 'Không có mô tả cho sản phẩm này.'}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Số lượng:</span>
            <div className="join">
              <button 
                className="btn join-item"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >-</button>
              <input 
                type="number" 
                className="join-item w-16 text-center" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max={product.stock}
              />
              <button 
                className="btn join-item"
                onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
              >+</button>
            </div>
            <span className="text-sm">({product.stock} sản phẩm có sẵn)</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              className="btn btn-primary flex-1"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
            
            <WishlistButton productId={safeProductId} />
          </div>
        </div>
      </div>
      
      {/* Đánh giá sản phẩm */}
      <section className="mt-12 card bg-base-100 shadow-sm p-6">
        <ErrorBoundary fallback={<div className="alert alert-error">Không thể tải đánh giá sản phẩm. Vui lòng thử lại sau.</div>}>
          <ProductReviews productId={safeProductId} />
        </ErrorBoundary>
      </section>
      
      {/* Sản phẩm liên quan */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Có thể bạn cũng thích</h2>
        <ErrorBoundary fallback={<div className="alert alert-error">Không thể tải gợi ý sản phẩm. Vui lòng thử lại sau.</div>}>
          <ProductRecommendations />
        </ErrorBoundary>
      </section>
    </div>
  );
} 