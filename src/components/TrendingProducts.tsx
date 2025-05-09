'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Eye, Zap, Clock, Check, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartProvider';
import toast from 'react-hot-toast';
import ProductCard from './ProductCard';
import { Product } from '@prisma/client';
import LoadingSpinner from './LoadingSpinner';
import SimpleLoader from './SimpleLoader';

interface Category {
  id: string;
  name: string;
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'newest';

function TrendingProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [showCart, setShowCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs for the card hover effect
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const { data: session, status } = useSession();
  const { addToCart } = useCart();
  
  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Thêm timestamp để tránh cache
      const timestamp = Date.now();
      console.log(`TrendingProducts: Đang tải sản phẩm nổi bật (timestamp: ${timestamp})`);
      
      const response = await axios.get(`/api/products?featured=true&_ts=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        timeout: 10000 // 10 giây timeout
      });
      
      // Đảm bảo dữ liệu isFeatured luôn là boolean
      const featuredProducts = response.data.map((product: any) => ({
        ...product,
        isFeatured: Boolean(product.isFeatured)
      }));
      
      console.log(`TrendingProducts: Đã tải ${featuredProducts.length} sản phẩm nổi bật`);
      featuredProducts.forEach((product: any) => {
        console.log(`- ${product.name} (ID: ${product.id}, Nổi bật: ${product.isFeatured})`);
      });
      
      setProducts(featuredProducts);
      setLoading(false);
    } catch (err: any) {
      console.error('Lỗi khi tải sản phẩm nổi bật:', err);
      setError('Không thể tải sản phẩm nổi bật. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tải sản phẩm nổi bật khi component mount
    fetchFeaturedProducts();
    
    // Thiết lập interval để tải lại dữ liệu mỗi 10 giây
    const intervalId = setInterval(fetchFeaturedProducts, 10000);
    
    // Thêm sự kiện để tải lại dữ liệu khi tab trở nên visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('TrendingProducts: Tab trở nên visible, đang tải lại sản phẩm nổi bật');
        fetchFeaturedProducts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup khi component unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Thêm function để tải lại dữ liệu thủ công
  const handleRefresh = () => {
    console.log('TrendingProducts: Đang tải lại sản phẩm nổi bật theo yêu cầu người dùng');
    fetchFeaturedProducts();
  };

  // Sắp xếp sản phẩm dựa trên lựa chọn
  useEffect(() => {
    if (products.length === 0) return;
    
    let sortedProducts = [...products];
    
    switch (sortOption) {
      case 'price_asc':
        sortedProducts.sort((a, b) => {
          const aPrice = a.discount ? a.price * (1 - a.discount / 100) : a.price;
          const bPrice = b.discount ? b.price * (1 - b.discount / 100) : b.price;
          return aPrice - bPrice;
        });
        break;
      case 'price_desc':
        sortedProducts.sort((a, b) => {
          const aPrice = a.discount ? a.price * (1 - a.discount / 100) : a.price;
          const bPrice = b.discount ? b.price * (1 - b.discount / 100) : b.price;
          return bPrice - aPrice;
        });
        break;
      case 'newest':
        sortedProducts.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      default:
        // Giữ nguyên thứ tự
        break;
    }
    
    setDisplayedProducts(sortedProducts);
  }, [products, sortOption]);
  
  // Cập nhật displayedProducts khi products thay đổi
  useEffect(() => {
    setDisplayedProducts(products);
  }, [products]);
  
  // Card 3D tilt effect
  useEffect(() => {
    if (!isMounted) return;
    
    const handleMouseMove = (e: MouseEvent, index: number) => {
      const card = cardRefs.current[index];
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // vị trí chuột X
      const y = e.clientY - rect.top;  // vị trí chuột Y
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;  // Xoay theo trục X
      const rotateY = (centerX - x) / 20;  // Xoay theo trục Y
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    };
    
    const handleMouseLeave = (index: number) => {
      const card = cardRefs.current[index];
      if (!card) return;
      
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };
    
    // Add event listeners
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      
      card.addEventListener('mousemove', (e) => handleMouseMove(e, index));
      card.addEventListener('mouseleave', () => handleMouseLeave(index));
    });
    
    // Cleanup
    return () => {
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        
        card.removeEventListener('mousemove', (e) => handleMouseMove(e as MouseEvent, index));
        card.removeEventListener('mouseleave', () => handleMouseLeave(index));
      });
    };
  }, [isMounted, displayedProducts.length]);
  
  const handleFavoriteToggle = useCallback(async (productId: string) => {
    // Kiểm tra người dùng đã đăng nhập chưa
    if (status !== 'authenticated' || !session) {
      // Lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
      localStorage.setItem('pendingWishlistItem', productId);
      // Điều hướng đến trang đăng nhập với tham số redirect
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      // Tìm sản phẩm hiện tại
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const currentlyFavorited = product.isFeatured;

      // Cập nhật UI trước để trải nghiệm người dùng tốt hơn
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isFeatured: !product.isFeatured } 
            : product
        )
      );

      if (currentlyFavorited) {
        // Xóa khỏi wishlist
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Không thể xóa khỏi danh sách yêu thích');
        }
        
        toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích');
      } else {
        // Thêm vào wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Không thể thêm vào danh sách yêu thích');
        }
        
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích');
      }
    } catch (error: any) {
      // Nếu có lỗi, khôi phục lại trạng thái ban đầu
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isFeatured: !product.isFeatured } 
            : product
        )
      );
      
      toast.error(error.message || 'Đã xảy ra lỗi khi thao tác với danh sách yêu thích');
      console.error('Lỗi khi thao tác với wishlist:', error);
    }
  }, [router, session, status, products]);
  
  const handleViewProduct = useCallback((productId: string) => {
    router.push(`/products/${productId}`);
  }, [router]);
  
  const handleAddToCart = useCallback(async (product: Product) => {
    // Kiểm tra người dùng đã đăng nhập chưa
    if (status !== 'authenticated' || !session) {
      // Hiển thị thông báo và lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
      localStorage.setItem('pendingCartItem', JSON.stringify({
        productId: product.id,
        name: product.name,
        quantity: 1
      }));
      
      // Điều hướng đến trang đăng nhập với tham số redirect
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    // Hiển thị thông báo trước để UX tốt hơn
    setCartMessage(`Đang thêm "${product.name}" vào giỏ hàng...`);
    setShowCart(true);
    
    try {
      // Sử dụng hàm addToCart từ context
      await addToCart(product.id, 1);
      
      // Cập nhật thông báo sau khi thêm thành công
      setCartMessage(`Đã thêm "${product.name}" vào giỏ hàng`);
      
      setTimeout(() => {
        setShowCart(false);
      }, 3000);
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      
      // Kiểm tra lỗi phiên đăng nhập
      if ((error as Error).message.includes('đăng nhập') || 
          (error as Error).message.includes('phiên')) {
        toast.error('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
        localStorage.setItem('pendingCartItem', JSON.stringify({
          productId: product.id,
          name: product.name,
          quantity: 1
        }));
        
        // Chuyển đến trang đăng nhập
        setTimeout(() => {
          router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
        }, 1500);
      } else {
        // Hiển thị lỗi khác
        setCartMessage(`Không thể thêm vào giỏ hàng: ${(error as Error).message}`);
        setTimeout(() => {
          setShowCart(false);
        }, 3000);
      }
    }
  }, [router, session, status, addToCart]);
  
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);
  
  const calculateDiscountedPrice = useCallback((price: number, discount: number = 0) => {
    if (!discount) return price;
    return price * (1 - discount / 100);
  }, []);
  
  const getSortIcon = (option: SortOption) => {
    if (sortOption !== option) return <ArrowUpDown size={14} />;
    
    switch (option) {
      case 'price_asc':
        return <ArrowUp size={14} />;
      case 'price_desc':
        return <ArrowDown size={14} />;
      default:
        return <ArrowUpDown size={14} />;
    }
  };

  // Hàm để hiển thị thời gian cập nhật
  const formatUpdateTime = useCallback((date: Date | null) => {
    if (!date) return 'Chưa cập nhật';
    
    // Tính thời gian tương đối
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 10) return 'Vừa cập nhật';
    if (diffSeconds < 60) return `${diffSeconds} giây trước`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    
    // Nếu quá 1 ngày thì hiển thị thời gian chính xác
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
            <button 
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
          
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size="large" color="blue" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
            <button 
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Thử lại
            </button>
          </div>
          
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
          <button 
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
        
        {!loading && !error && products.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <p>Không có sản phẩm nổi bật nào. Vui lòng kiểm tra lại sau.</p>
          </div>
        )}
        
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TrendingProducts); 