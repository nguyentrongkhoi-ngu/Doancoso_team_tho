import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OrderItem } from '@/hooks/useOrderDetails';
import { formatCurrency } from '@/lib/orderUtils';
import { isValidURL, customImageLoader } from '@/lib/imageLoader';

interface OrderItemsProps {
  items: OrderItem[];
  total: number;
}

/**
 * Component hiển thị danh sách sản phẩm trong đơn hàng
 */
const OrderItems: React.FC<OrderItemsProps> = ({ items, total }) => {
  return (
    <div>
      <h4 className="text-lg font-medium mb-4">Sản phẩm</h4>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Số lượng</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-12 h-12 mask mask-squircle">
                        {item.product.imageUrl && isValidURL(item.product.imageUrl) ? (
                          <Image 
                            loader={customImageLoader}
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <ProductImagePlaceholder />
                        )}
                      </div>
                    </div>
                    <div>
                      <Link href={`/products/${item.product.id}`} className="font-medium hover:underline">
                        {item.product.name}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="text-right">{formatCurrency(item.price)}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold">Tổng cộng</td>
              <td className="text-right font-bold text-lg">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/**
 * Placeholder cho hình ảnh sản phẩm khi không có hoặc lỗi
 */
const ProductImagePlaceholder: React.FC = () => {
  return (
    <div className="bg-base-300 flex items-center justify-center w-full h-full">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
};

export default OrderItems; 