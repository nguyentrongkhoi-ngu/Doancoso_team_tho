'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ApiConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function checkApiConnection() {
      try {
        const response = await fetch('/api/admin/products/check');
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(`API kết nối thành công. User: ${data.user?.email}`);
          console.log('API connection test success:', data);
          
          // Ẩn sau 10 giây
          setTimeout(() => setIsVisible(false), 10000);
        } else {
          setStatus('error');
          setMessage(`Lỗi: ${data.message || 'Không thể kết nối API'}`);
          console.error('API connection test failed:', data);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Lỗi: Không thể kết nối tới API');
        console.error('API connection test error:', error);
      }
    }

    checkApiConnection();
  }, []);

  const testToggleFeaturedApi = async () => {
    try {
      toast.loading('Đang kiểm tra API toggle-featured...');
      
      // Test với fetch API
      const response = await fetch('/api/admin/products/toggle-featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'test',
          isFeatured: true
        }),
      });
      
      const data = await response.json().catch(() => ({ error: 'Không thể parse JSON' }));
      
      if (response.ok) {
        toast.success('Kết nối tới API toggle-featured thành công');
      } else if (response.status === 404) {
        toast.error('Không tìm thấy API endpoint toggle-featured (404)');
      } else {
        toast.error(`Lỗi: ${data.message || data.error || response.statusText}`);
      }
      
      console.log('Toggle Featured API test:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (error) {
      console.error('Error testing toggle-featured API:', error);
      toast.error('Lỗi khi gọi API: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  if (!isVisible) return null;

  return (
    <div className={`p-4 mb-6 rounded-lg ${
      status === 'loading' ? 'bg-blue-100' :
      status === 'success' ? 'bg-green-100' :
      'bg-red-100'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Trạng thái kết nối API</h3>
          <p className={
            status === 'loading' ? 'text-blue-600' :
            status === 'success' ? 'text-green-600' :
            'text-red-600'
          }>
            {status === 'loading' ? 'Đang kiểm tra...' : message}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={testToggleFeaturedApi}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Kiểm tra API Featured
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
} 