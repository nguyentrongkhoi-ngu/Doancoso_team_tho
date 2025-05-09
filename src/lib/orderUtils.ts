/**
 * Format date to Vietnamese locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format currency to Vietnamese format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount);
};

/**
 * Get status info with display text and color class
 */
export const getOrderStatusInfo = (status: string): { text: string, color: string } => {
  switch (status) {
    case 'PENDING':
      return { text: 'Đang xử lý', color: 'badge-warning' };
    case 'PROCESSING':
      return { text: 'Đang chuẩn bị', color: 'badge-info' };
    case 'SHIPPED':
      return { text: 'Đang giao hàng', color: 'badge-info' };
    case 'DELIVERED':
      return { text: 'Đã giao hàng', color: 'badge-success' };
    case 'COMPLETED':
      return { text: 'Hoàn thành', color: 'badge-success' };
    case 'CANCELLED':
      return { text: 'Đã hủy', color: 'badge-error' };
    default:
      return { text: status, color: 'badge-neutral' };
  }
};

/**
 * Check if an order is cancellable
 */
export const isOrderCancellable = (status: string): boolean => {
  return ["PENDING", "PROCESSING"].includes(status);
};

/**
 * Check if an order is returnable
 */
export const isOrderReturnable = (status: string): boolean => {
  return ["DELIVERED", "COMPLETED"].includes(status);
};

/**
 * Check if an order can be reordered
 */
export const canReorderOrder = (status: string): boolean => {
  return ["DELIVERED", "COMPLETED", "CANCELLED"].includes(status);
}; 