'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import WishlistSection from '@/components/profile/WishlistSection';
import Link from 'next/link';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirectTo=/wishlist');
    }
  }, [status, router]);

  // Error handling function for WishlistSection
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(''), 5000);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show a message (redirection is handled by useEffect)
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Vui lòng đăng nhập để xem sản phẩm yêu thích</p>
          <Link href="/login?redirectTo=/wishlist" className="btn btn-primary">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="text-sm breadcrumbs mb-6">
        <ul>
          <li><Link href="/">Trang chủ</Link></li>
          <li className="font-medium">Sản phẩm yêu thích</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold mb-8">Sản phẩm yêu thích</h1>
      
      {/* Show error message if any */}
      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Embed the WishlistSection */}
      <div className="bg-base-100 rounded-lg shadow p-6">
        <WishlistSection 
          onError={handleError} 
        />
      </div>
    </div>
  );
} 