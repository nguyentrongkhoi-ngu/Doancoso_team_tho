'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'fail' | null>(null);

  useEffect(() => {
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    if (vnp_ResponseCode === '00') {
      setStatus('success');
    } else {
      setStatus('fail');
    }
  }, [searchParams]);

  if (status === null) return null;

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-success">Thanh toán thành công!</h2>
        <p className="text-base-content/70 mb-6">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán thành công qua VNPAY.</p>
        <a href="/" className="btn btn-primary">Tiếp tục mua sắm</a>
      </div>
    );
  }

  // Hiển thị giao diện thất bại
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-error">Thanh toán thất bại</h2>
      <p className="text-base-content/70 mb-6">Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
      <a href="/" className="btn btn-outline">Quay về trang chủ</a>
    </div>
  );
}