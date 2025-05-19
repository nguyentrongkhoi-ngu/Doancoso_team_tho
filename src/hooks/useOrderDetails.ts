import { useState, useEffect, useCallback } from 'react';

// Define types
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    description?: string;
    price?: number;
  };
}

export interface ShippingAddress {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface ReturnItem {
  orderItemId: string;
  quantity: number;
  maxQuantity: number;
  reason: string;
  selected: boolean;
}

export interface OrderDetailsHookResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
  showCancelModal: boolean;
  showReturnModal: boolean;
  cancelReason: string;
  isCancelling: boolean;
  isReturning: boolean;
  isReordering: boolean;
  actionSuccess: string | null;
  returnItems: ReturnItem[];
  returnReason: string;
  
  setShowCancelModal: (show: boolean) => void;
  setShowReturnModal: (show: boolean) => void;
  setCancelReason: (reason: string) => void;
  setReturnReason: (reason: string) => void;
  setError: (error: string | null) => void;
  
  handleCancelOrder: () => Promise<void>;
  handleReturnOrder: () => Promise<void>;
  handleReorder: () => Promise<void>;
  handleDownloadInvoice: () => void;
  toggleItemSelection: (orderItemId: string) => void;
  handleReturnQuantityChange: (orderItemId: string, quantity: number) => void;
  handleReturnReasonChange: (orderItemId: string, reason: string) => void;
}

/**
 * Custom hook to manage order details state and actions
 */
export const useOrderDetails = (orderId: string): OrderDetailsHookResult => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Action states
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Return states
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Could not fetch order details');
        }
        
        const data = await response.json();
        setOrder(data.order);
        
        // Initialize return items
        if (data.order && data.order.items) {
          setReturnItems(
            data.order.items.map((item: OrderItem) => ({
              orderItemId: item.id,
              quantity: 0,
              maxQuantity: item.quantity,
              reason: '',
              selected: false
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!order) return;
    
    try {
      setIsCancelling(true);
      
      const response = await fetch(`/api/orders/${order.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel order');
      }
      
      const data = await response.json();
      setOrder(data.order);
      setShowCancelModal(false);
      setActionSuccess('Đơn hàng đã được hủy thành công!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  }, [order, cancelReason]);
  
  // Handle return order
  const handleReturnOrder = useCallback(async () => {
    if (!order) return;
    
    // Check if any items are selected
    const selectedItems = returnItems.filter(item => item.selected && item.quantity > 0);
    
    if (selectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để trả lại.');
      return;
    }
    
    try {
      setIsReturning(true);
      
      const response = await fetch(`/api/orders/${order.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'return',
          reason: returnReason,
          returnItems: selectedItems.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason,
          })),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit return request');
      }
      
      const data = await response.json();
      
      // Refresh order data
      const orderResponse = await fetch(`/api/orders/${order.id}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }
      
      setShowReturnModal(false);
      setActionSuccess('Yêu cầu trả hàng đã được gửi thành công! Bạn có thể xem chi tiết tại trang "Yêu cầu trả hàng".');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi gửi yêu cầu trả hàng.');
    } finally {
      setIsReturning(false);
    }
  }, [order, returnItems, returnReason]);
  
  // Handle reorder
  const handleReorder = useCallback(async () => {
    if (!order) return;
    
    try {
      setIsReordering(true);
      
      const response = await fetch(`/api/orders/${order.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reorder',
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reorder');
      }
      
      const data = await response.json();
      
      setActionSuccess('Đơn hàng mới đã được tạo thành công!');
      
      // Redirect to the new order after a brief pause
      setTimeout(() => {
        window.location.href = `/orders/${data.newOrder.id}`;
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đặt lại đơn hàng.');
    } finally {
      setIsReordering(false);
    }
  }, [order]);
  
  // Handle download invoice
  const handleDownloadInvoice = useCallback(() => {
    if (!order) return;
    
    // Open the invoice download URL in a new tab
    window.open(`/api/orders/${order.id}/invoice/download`, '_blank');
  }, [order]);
  
  // Toggle item selection for return
  const toggleItemSelection = useCallback((orderItemId: string) => {
    setReturnItems(prevItems => 
      prevItems.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, selected: !item.selected } 
          : item
      )
    );
  }, []);
  
  // Handle item quantity change for return
  const handleReturnQuantityChange = useCallback((orderItemId: string, quantity: number) => {
    setReturnItems(prevItems => 
      prevItems.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) } 
          : item
      )
    );
  }, []);
  
  // Handle item reason change for return
  const handleReturnReasonChange = useCallback((orderItemId: string, reason: string) => {
    setReturnItems(prevItems => 
      prevItems.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, reason } 
          : item
      )
    );
  }, []);

  return {
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
  };
}; 