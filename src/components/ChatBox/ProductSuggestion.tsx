'use client';

import { ProductSuggestion as ProductSuggestionType } from '@/types/chat';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaStar } from 'react-icons/fa';
import { formatCurrency } from '@/utils/format';

interface ProductSuggestionProps {
  product: ProductSuggestionType;
}

export const ProductCard = ({ product }: ProductSuggestionProps) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(product.url);
  };
  
  // Format giá tiền
  const formattedPrice = formatCurrency(product.price, product.currency);
  
  // Tính giá sau khuyến mãi nếu có
  const discountedPrice = product.discount 
    ? formatCurrency(product.price * (1 - product.discount / 100), product.currency)
    : null;
  
  return (
    <div 
      className="flex flex-col bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-primary/30 hover:-translate-y-1"
      onClick={handleClick}
    >
      <div className="relative h-32 w-full bg-gray-100">
        {product.imageUrl ? (
          <div className="relative h-full w-full">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full"
              onError={(e) => {
                // Fallback image if the product image fails to load
                (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
              }}
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {product.discount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Hết hàng</span>
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        
        {product.rating && (
          <div className="flex items-center mb-1">
            <FaStar className="text-yellow-400 w-3 h-3" />
            <span className="text-xs text-gray-600 ml-1">{product.rating.toFixed(1)}</span>
          </div>
        )}
        
        <div className="mt-auto">
          {discountedPrice ? (
            <div className="flex flex-col">
              <span className="text-red-600 font-medium text-sm">{discountedPrice}</span>
              <span className="text-gray-400 text-xs line-through">{formattedPrice}</span>
            </div>
          ) : (
            <span className="text-gray-800 font-medium text-sm">{formattedPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProductSuggestionsProps {
  products: ProductSuggestionType[];
}

const ProductSuggestions = ({ products }: ProductSuggestionsProps) => {
  if (!products || products.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 mb-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductSuggestions; 