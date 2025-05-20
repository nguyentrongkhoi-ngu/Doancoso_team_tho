'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, useCallback } from 'react';

// Dynamically import ChatBox to avoid SSR issues with translations
const ChatBox = dynamic(() => import('./ChatBox/ChatBox'), {
  ssr: false,
  loading: () => <ChatBoxSkeleton />
});

// Skeleton loader cho ChatBox
function ChatBoxSkeleton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] animate-pulse">
        <div className="h-14 border-b bg-gray-100"></div>
        <div className="p-4 flex flex-col gap-2">
          <div className="h-10 w-3/4 bg-gray-100 rounded-lg"></div>
          <div className="h-10 w-1/2 self-end bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default function ChatBoxWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Chỉ render ở phía client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hàm để thử lại khi có lỗi
  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setHasError(false);
      setRetryCount(prev => prev + 1);
    }
  }, [retryCount]);

  if (!isMounted) return null;

  if (hasError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-4 w-72">
          <p className="text-red-500 mb-2">Không thể tải chatbox</p>
          {retryCount < MAX_RETRIES ? (
            <button 
              onClick={handleRetry}
              className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
            >
              Thử lại
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Đã vượt quá số lần thử lại. Vui lòng tải lại trang.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ChatBoxSkeleton />}>
      <ErrorBoundary onError={() => setHasError(true)}>
        <ChatBox />
      </ErrorBoundary>
    </Suspense>
  );
}

// ErrorBoundary component cải tiến
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: () => void }) {
  useEffect(() => {
    // Tạo một hàm xử lý lỗi
    const handleError = (event: ErrorEvent) => {
      // Kiểm tra nếu lỗi liên quan đến ChatBox
      if (event.error && (
        event.error.message?.includes('ChatBox') || 
        event.error.stack?.includes('ChatBox') ||
        event.error.message?.includes('chat') ||
        event.error.message?.includes('useChat')
      )) {
        console.error('ChatBox error:', event.error);
        onError();
      }
    };
    
    // Xử lý lỗi không bắt được
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (
        event.reason.message?.includes('ChatBox') ||
        event.reason.stack?.includes('ChatBox') ||
        event.reason.message?.includes('chat')
      )) {
        console.error('Unhandled ChatBox promise rejection:', event.reason);
        onError();
      }
    };
    
    // Thêm event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup khi component unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  return <>{children}</>;
} 