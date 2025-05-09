'use client';

import React from 'react';
import Link from 'next/link';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import OrderStatusTracker from '@/components/order/OrderStatus';
import OrderItems from '@/components/order/OrderItems';
import { OrderInfo, OrderNotes, OrderActionButtons } from '@/components/order/OrderInfo';
import { CancelOrderModal, ReturnOrderModal } from '@/components/order/OrderActionModals';
import { Loading, ErrorAlert, WarningAlert, SuccessAlert } from '@/components/ui/Notifications';

interface OrderDetailsProps {
  orderId: string;
  onClose?: () => void;
}

/**
 * Component hiển thị chi tiết đơn hàng
 */
export default function OrderDetails({ orderId, onClose }: OrderDetailsProps) {
  const {
    order,
    loading,
    error,
    showCancelModal,
    showReturnModal,
    cancelReason,
    isCancelling,
    isReturning,
    isReordering,
    actionSuccess,
    returnItems,
    returnReason,
    
    setShowCancelModal,
    setShowReturnModal,
    setCancelReason,
    setReturnReason,
    setError,
    
    handleCancelOrder,
    handleReturnOrder,
    handleReorder,
    handleDownloadInvoice,
    toggleItemSelection,
    handleReturnQuantityChange,
    handleReturnReasonChange,
  } = useOrderDetails(orderId);

  if (loading) {
    return <Loading message="Đang tải thông tin đơn hàng..." />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!order) {
    return <WarningAlert message="Không tìm thấy thông tin đơn hàng." />;
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg">
      {/* Order header with close button */}
      <div className="p-6 border-b border-base-300">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">
            Chi tiết đơn hàng #{order.id.substring(0, 8)}
          </h3>
          {onClose && (
            <button 
              onClick={onClose}
              className="btn btn-sm btn-circle"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Success and error messages */}
      {actionSuccess && (
        <div className="p-4">
          <SuccessAlert 
            message={actionSuccess}
            linkText={actionSuccess.includes('trả hàng') ? 'Xem ngay' : undefined}
            linkHref={actionSuccess.includes('trả hàng') ? '/profile/returns' : undefined}
          />
        </div>
      )}
      
      {error && (
        <div className="p-4">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Order info and items */}
      <div className="p-6">
        {/* Order info */}
        <OrderInfo order={order} />

        {/* Order status tracker */}
        <OrderStatusTracker status={order.status} />

        {/* Order items */}
        <OrderItems items={order.items} total={order.total} />

        {/* Order notes */}
        <OrderNotes notes={order.notes} />

        {/* Action buttons */}
        <OrderActionButtons 
          order={order}
          onCancelOrder={() => setShowCancelModal(true)}
          onReturnOrder={() => setShowReturnModal(true)}
          onReorder={handleReorder}
          onDownloadInvoice={handleDownloadInvoice}
          onClose={onClose}
          isReordering={isReordering}
        />
      </div>
      
      {/* Modals */}
      <CancelOrderModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        cancelReason={cancelReason}
        onReasonChange={setCancelReason}
        isCancelling={isCancelling}
      />
      
      <ReturnOrderModal 
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleReturnOrder}
        returnItems={returnItems}
        orderItems={order.items}
        returnReason={returnReason}
        onReturnReasonChange={setReturnReason}
        onToggleItem={toggleItemSelection}
        onQuantityChange={handleReturnQuantityChange}
        onItemReasonChange={handleReturnReasonChange}
        isReturning={isReturning}
      />
    </div>
  );
} 