'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Kiểm tra xem sản phẩm đã có trong danh sách yêu thích chưa
  useEffect(() => {
    if (!session?.user?.id) {
      setIsChecking(false);
      return;
    }

    const checkWishlistStatus = async () => {
      try {
        setIsChecking(true);
        const response = await fetch(`/api/wishlist/check?productId=${productId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.isInWishlist);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái wishlist:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkWishlistStatus();
  }, [session, productId]);

  const handleToggleWishlist = async () => {
    if (!session) {
      // Lưu sản phẩm vào localStorage để sau khi đăng nhập có thể thêm lại
      localStorage.setItem('pendingWishlistItem', productId);
      router.push(`/login?redirectTo=${encodeURIComponent(`/products/${productId}`)}`);
      return;
    }

    try {
      setIsLoading(true);

      if (isInWishlist) {
        // Xóa khỏi wishlist
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsInWishlist(false);
          toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích');
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Không thể xóa khỏi danh sách yêu thích');
        }
      } else {
        // Thêm vào wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          setIsInWishlist(true);
          toast.success('Đã thêm sản phẩm vào danh sách yêu thích');
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Không thể thêm vào danh sách yêu thích');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`btn ${isInWishlist ? 'btn-secondary' : 'btn-outline'} ${className}`}
      onClick={handleToggleWishlist}
      disabled={isLoading || isChecking}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-1"
        fill={isInWishlist ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
    </button>
  );
} 