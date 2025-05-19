import { useCallback } from 'react';

/**
 * Hook để theo dõi hành vi người dùng trên toàn ứng dụng
 */
export function useTracking() {
  /**
   * Ghi lại hành động xem sản phẩm
   * @param productId - ID của sản phẩm đang xem
   * @param duration - Thời gian xem (tính bằng giây)
   */
  const trackProductView = useCallback(async (productId: string, duration?: number) => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'view_product',
          productId,
          duration,
        }),
      });
      
      if (!response.ok) {
        console.error('Error tracking product view:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }, []);
  
  /**
   * Ghi lại hành động tìm kiếm
   * @param searchQuery - Từ khóa tìm kiếm
   */
  const trackSearch = useCallback(async (searchQuery: string) => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          searchQuery,
        }),
      });
      
      if (!response.ok) {
        console.error('Error tracking search:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);
  
  /**
   * Ghi lại hành động thêm vào giỏ hàng
   * @param productId - ID của sản phẩm được thêm vào giỏ
   */
  const trackAddToCart = useCallback(async (productId: string) => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_to_cart',
          productId,
        }),
      });
      
      if (!response.ok) {
        console.error('Error tracking add to cart:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, []);
  
  /**
   * Ghi lại hành động mua hàng
   */
  const trackPurchase = useCallback(async () => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'purchase',
        }),
      });
      
      if (!response.ok) {
        console.error('Error tracking purchase:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, []);
  
  /**
   * Ghi lại hành động click vào chi tiết sản phẩm
   * @param productId - ID của sản phẩm
   */
  const trackProductClick = useCallback(async (productId: string) => {
    try {
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'product_click',
          productId,
        }),
      });
      
      if (!response.ok) {
        console.error('Error tracking product click:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track product click:', error);
    }
  }, []);

  return {
    trackProductView,
    trackSearch,
    trackAddToCart,
    trackPurchase,
    trackProductClick
  };
} 