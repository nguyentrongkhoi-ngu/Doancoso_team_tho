'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface AccountSettingsSectionProps {
  onError: (message: string) => void;
}

export default function AccountSettingsSection({ onError }: AccountSettingsSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    productAlerts: true
  });
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications({
      ...notifications,
      [name]: checked
    });
    
    // Save notification settings (mock implementation)
    setTimeout(() => {
      console.log('Saved notification settings', { [name]: checked });
    }, 300);
  };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể xóa tài khoản');
      }
      
      // Sign out and redirect to home page
      signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error);
      onError('Không thể xóa tài khoản. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  return (
    <div className="space-y-8">
      {/* Đăng xuất */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body">
          <h3 className="text-lg font-medium">Đăng xuất</h3>
          <p className="text-sm text-base-content/70">Đăng xuất khỏi tài khoản của bạn trên thiết bị này.</p>
          <div className="card-actions justify-end mt-4">
            <button 
              className="btn btn-outline"
              onClick={handleSignOut}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
      
      {/* Cài đặt thông báo */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body">
          <h3 className="text-lg font-medium">Cài đặt thông báo</h3>
          <p className="text-sm text-base-content/70 mb-4">Tùy chỉnh các thông báo bạn muốn nhận qua email.</p>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start">
              <input 
                type="checkbox" 
                name="orderUpdates"
                checked={notifications.orderUpdates}
                onChange={handleNotificationChange}
                className="checkbox checkbox-primary mr-4" 
              />
              <div>
                <span className="label-text font-medium">Cập nhật đơn hàng</span>
                <p className="text-xs text-base-content/70">Thông báo về trạng thái đơn hàng và giao hàng.</p>
              </div>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start">
              <input 
                type="checkbox" 
                name="promotions"
                checked={notifications.promotions}
                onChange={handleNotificationChange}
                className="checkbox checkbox-primary mr-4" 
              />
              <div>
                <span className="label-text font-medium">Khuyến mãi và ưu đãi</span>
                <p className="text-xs text-base-content/70">Thông tin về khuyến mãi, giảm giá và ưu đãi đặc biệt.</p>
              </div>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start">
              <input 
                type="checkbox" 
                name="productAlerts"
                checked={notifications.productAlerts}
                onChange={handleNotificationChange}
                className="checkbox checkbox-primary mr-4" 
              />
              <div>
                <span className="label-text font-medium">Thông báo sản phẩm</span>
                <p className="text-xs text-base-content/70">Cập nhật về sản phẩm trong danh sách yêu thích hoặc giảm giá.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Xóa tài khoản */}
      <div className="card bg-base-100 shadow-sm border border-error/30">
        <div className="card-body">
          <h3 className="text-lg font-medium text-error">Xóa tài khoản</h3>
          <p className="text-sm text-base-content/70">
            Thao tác này sẽ xóa vĩnh viễn tài khoản của bạn và tất cả dữ liệu liên quan. 
            Hành động này không thể hoàn tác.
          </p>
          
          <div className="card-actions justify-end mt-4">
            {showDeleteConfirm ? (
              <div className="flex flex-col w-full sm:flex-row sm:w-auto gap-2">
                <button 
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Hủy
                </button>
                <button 
                  className="btn btn-error"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận xóa tài khoản'}
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-outline btn-error"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Xóa tài khoản
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 