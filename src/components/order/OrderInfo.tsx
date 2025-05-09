import React from 'react';
import { Order } from '@/hooks/useOrderDetails';
import { formatDate, formatCurrency, getOrderStatusInfo, isOrderCancellable, isOrderReturnable, canReorderOrder } from '@/lib/orderUtils';

interface OrderInfoProps {
  order: Order;
}

/**
 * Component hiển thị thông tin chung của đơn hàng
 */
export const OrderInfo: React.FC<OrderInfoProps> = ({ order }) => {
  const statusInfo = getOrderStatusInfo(order.status);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <h4 className="text-lg font-medium mb-2">Thông tin đơn hàng</h4>
        <div className="space-y-2 text-sm">
          <p><strong>Mã đơn hàng:</strong> #{order.id}</p>
          <p><strong>Ngày đặt:</strong> {formatDate(order.createdAt)}</p>
          <p>
            <strong>Trạng thái:</strong> 
            <span className={`badge ${statusInfo.color} ml-2`}>{statusInfo.text}</span>
          </p>
          {order.trackingNumber && (
            <p><strong>Mã vận đơn:</strong> {order.trackingNumber}</p>
          )}
          {order.paymentMethod && (
            <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod}</p>
          )}
        </div>
      </div>

      {order.shippingAddress && (
        <div>
          <h4 className="text-lg font-medium mb-2">Địa chỉ giao hàng</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Người nhận:</strong> {order.shippingAddress.fullName}</p>
            <p><strong>Địa chỉ:</strong> {order.shippingAddress.address}</p>
            <p><strong>Thành phố:</strong> {order.shippingAddress.city}</p>
            <p><strong>Số điện thoại:</strong> {order.shippingAddress.phoneNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface OrderNotesProps {
  notes?: string;
}

/**
 * Component hiển thị ghi chú đơn hàng
 */
export const OrderNotes: React.FC<OrderNotesProps> = ({ notes }) => {
  if (!notes) return null;
  
  return (
    <div className="mt-6">
      <h4 className="text-lg font-medium mb-2">Ghi chú</h4>
      <div className="bg-base-200 p-4 rounded-lg">
        <p>{notes}</p>
      </div>
    </div>
  );
};

interface OrderActionButtonsProps {
  order: Order;
  onCancelOrder: () => void;
  onReturnOrder: () => void;
  onReorder: () => void;
  onDownloadInvoice: () => void;
  onClose?: () => void;
  isReordering: boolean;
}

/**
 * Component hiển thị các nút thao tác với đơn hàng
 */
export const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  order,
  onCancelOrder,
  onReturnOrder,
  onReorder,
  onDownloadInvoice,
  onClose,
  isReordering
}) => {
  return (
    <div className="mt-8 flex flex-wrap justify-end gap-4">
      {/* Nút hủy đơn hàng */}
      {isOrderCancellable(order.status) && (
        <button 
          className="btn btn-error"
          onClick={onCancelOrder}
        >
          Hủy đơn hàng
        </button>
      )}
      
      {/* Nút yêu cầu trả hàng */}
      {isOrderReturnable(order.status) && (
        <button 
          className="btn btn-warning"
          onClick={onReturnOrder}
        >
          Yêu cầu trả hàng
        </button>
      )}
      
      {/* Nút tải hóa đơn */}
      <button 
        className="btn btn-accent"
        onClick={onDownloadInvoice}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Tải hóa đơn
      </button>
      
      {/* Nút đặt lại đơn hàng */}
      {canReorderOrder(order.status) && (
        <button 
          className="btn btn-primary"
          onClick={onReorder}
          disabled={isReordering}
        >
          {isReordering ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Đang xử lý...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Đặt lại đơn hàng
            </>
          )}
        </button>
      )}
      
      {/* Nút đóng chi tiết đơn hàng */}
      {onClose && (
        <button className="btn btn-outline" onClick={onClose}>
          Đóng
        </button>
      )}
    </div>
  );
}; 