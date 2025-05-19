'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function FixSchemaButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const fixSchema = async () => {
    setIsLoading(true);
    
    try {
      toast.loading('Đang kiểm tra và sửa chữa schema...');
      
      const response = await fetch('/api/admin/products/fix-schema');
      const data = await response.json();
      
      if (response.ok) {
        if (data.action === 'added_column') {
          toast.success('Đã thêm cột isFeatured vào bảng Product thành công!');
        } else {
          toast.success('Cột isFeatured đã tồn tại. Không cần sửa chữa.');
        }
        
        // Reload trang sau 2 giây để áp dụng thay đổi
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`Lỗi: ${data.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fixing schema:', error);
      toast.error('Đã xảy ra lỗi khi sửa chữa schema');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={fixSchema}
      disabled={isLoading}
      className="px-4 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang sửa chữa...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
          Sửa chữa schema database
        </>
      )}
    </button>
  );
} 