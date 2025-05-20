'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Định nghĩa kiểu dữ liệu cho ảnh sản phẩm
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  order?: number;
}

// Định nghĩa kiểu dữ liệu cho sản phẩm
export interface CurrentProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  imageUrl?: string | null;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  images?: ProductImage[];
}

interface ProductContextType {
  currentProduct: CurrentProduct | null;
  setCurrentProduct: (product: CurrentProduct | null) => void;
  isProductPage: boolean;
}

// Tạo context với giá trị mặc định
const ProductContext = createContext<ProductContextType>({
  currentProduct: null,
  setCurrentProduct: () => {},
  isProductPage: false,
});

// Hook để sử dụng context
export const useCurrentProduct = () => useContext(ProductContext);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider = ({ children }: ProductProviderProps) => {
  const [currentProduct, setCurrentProduct] = useState<CurrentProduct | null>(null);
  const pathname = usePathname();
  
  // Kiểm tra xem người dùng có đang ở trang chi tiết sản phẩm không
  const isProductPage = pathname ? pathname.startsWith('/products/') && pathname.split('/').length > 2 : false;
  
  // Tự động lấy thông tin sản phẩm từ URL nếu đang ở trang chi tiết sản phẩm
  useEffect(() => {
    if (isProductPage) {
      const productId = pathname?.split('/').pop();
      
      if (productId && (!currentProduct || currentProduct.id !== productId)) {
        // Fetch thông tin sản phẩm
        const fetchProductData = async () => {
          try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
              const product = await response.json();
              setCurrentProduct(product);
            }
          } catch (error) {
            console.error('Error fetching product data:', error);
          }
        };
        
        fetchProductData();
      }
    } else {
      // Nếu không ở trang sản phẩm, reset thông tin sản phẩm hiện tại
      setCurrentProduct(null);
    }
  }, [pathname, isProductPage]);
  
  return (
    <ProductContext.Provider value={{ currentProduct, setCurrentProduct, isProductPage }}>
      {children}
    </ProductContext.Provider>
  );
}; 