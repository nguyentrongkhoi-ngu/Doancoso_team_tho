import React from 'react';
import Image from 'next/image';
import { OrderItem, ReturnItem } from '@/hooks/useOrderDetails';
import { isValidURL, customImageLoader } from '@/lib/imageLoader';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cancelReason: string;
  onReasonChange: (reason: string) => void;
  isCancelling: boolean;
}

/**
 * Modal xác nhận hủy đơn hàng
 */
export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cancelReason,
  onReasonChange,
  isCancelling
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-base-100 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Xác nhận hủy đơn hàng</h3>
        
        <p className="mb-4">Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Lý do hủy đơn hàng</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={cancelReason}
            onChange={(e) => onReasonChange(e.target.value)}
          >
            <option value="">-- Chọn lý do --</option>
            <option value="Tôi muốn thay đổi địa chỉ giao hàng">Tôi muốn thay đổi địa chỉ giao hàng</option>
            <option value="Tôi muốn thay đổi phương thức thanh toán">Tôi muốn thay đổi phương thức thanh toán</option>
            <option value="Tôi không còn muốn sản phẩm này nữa">Tôi không còn muốn sản phẩm này nữa</option>
            <option value="Tôi đặt nhầm sản phẩm">Tôi đặt nhầm sản phẩm</option>
            <option value="Thời gian giao hàng quá lâu">Thời gian giao hàng quá lâu</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
        </div>
        
        {cancelReason === 'Lý do khác' && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Chi tiết lý do</span>
            </label>
            <textarea 
              className="textarea textarea-bordered h-24"
              placeholder="Nhập lý do của bạn"
              onChange={(e) => onReasonChange(e.target.value)}
            ></textarea>
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <button 
            className="btn btn-outline"
            onClick={onClose}
          >
            Hủy bỏ
          </button>
          <button 
            className="btn btn-error"
            onClick={onConfirm}
            disabled={isCancelling || !cancelReason}
          >
            {isCancelling ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Đang xử lý...
              </>
            ) : 'Xác nhận hủy đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReturnOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  returnItems: ReturnItem[];
  orderItems: OrderItem[];
  returnReason: string;
  onReturnReasonChange: (reason: string) => void;
  onToggleItem: (orderItemId: string) => void;
  onQuantityChange: (orderItemId: string, quantity: number) => void;
  onItemReasonChange: (orderItemId: string, reason: string) => void;
  isReturning: boolean;
}

/**
 * Modal yêu cầu trả hàng
 */
export const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  returnItems,
  orderItems,
  returnReason,
  onReturnReasonChange,
  onToggleItem,
  onQuantityChange,
  onItemReasonChange,
  isReturning
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-base-100 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Yêu cầu trả hàng</h3>
        
        <p className="mb-4">Vui lòng chọn các sản phẩm bạn muốn trả lại và cung cấp lý do.</p>
        
        <div className="overflow-x-auto mb-4">
          <table className="table w-full">
            <thead>
              <tr>
                <th></th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => {
                const returnItem = returnItems.find(ri => ri.orderItemId === item.id);
                if (!returnItem) return null;
                
                return (
                  <tr key={item.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="checkbox" 
                        checked={returnItem.selected}
                        onChange={() => onToggleItem(item.id)}
                      />
                    </td>
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
                              <div className="bg-base-300 flex items-center justify-center w-full h-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{item.product.name}</div>
                          <div className="text-sm opacity-50">Đã mua: {item.quantity}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input input-bordered w-24" 
                        min="1" 
                        max={returnItem.maxQuantity}
                        value={returnItem.quantity}
                        onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value))}
                        disabled={!returnItem.selected}
                      />
                    </td>
                    <td>
                      <select 
                        className="select select-bordered w-full max-w-xs"
                        value={returnItem.reason}
                        onChange={(e) => onItemReasonChange(item.id, e.target.value)}
                        disabled={!returnItem.selected}
                      >
                        <option value="">-- Chọn lý do --</option>
                        <option value="Sản phẩm bị lỗi">Sản phẩm bị lỗi</option>
                        <option value="Không đúng kích thước">Không đúng kích thước</option>
                        <option value="Không như mô tả">Không như mô tả</option>
                        <option value="Nhận sai sản phẩm">Nhận sai sản phẩm</option>
                        <option value="Chất lượng kém">Chất lượng kém</option>
                        <option value="Lý do khác">Lý do khác</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Lý do trả hàng chung (tùy chọn)</span>
          </label>
          <textarea 
            className="textarea textarea-bordered h-24"
            placeholder="Thêm thông tin chi tiết về lý do trả hàng"
            value={returnReason}
            onChange={(e) => onReturnReasonChange(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-4 mt-4">
          <button 
            className="btn btn-outline"
            onClick={onClose}
          >
            Hủy bỏ
          </button>
          <button 
            className="btn btn-warning"
            onClick={onConfirm}
            disabled={isReturning || returnItems.every(item => !item.selected || item.quantity === 0)}
          >
            {isReturning ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Đang xử lý...
              </>
            ) : 'Gửi yêu cầu trả hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}; 