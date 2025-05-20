'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ChatNotifications() {
  const [pendingSessions, setPendingSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Không hiển thị thông báo nếu đang ở trang quản lý chat
  const isOnChatManagementPage = pathname === '/admin/chat-management';

  useEffect(() => {
    const fetchPendingSessions = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/admin/chat-sessions?status=pending');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pending sessions');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPendingSessions(data.sessions.length);
        }
      } catch (err) {
        console.error('Error fetching pending sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPendingSessions();
    
    // Refresh data every minute
    const interval = setInterval(fetchPendingSessions, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    router.push('/admin/chat-management?filter=pending');
  };

  if (isLoading || pendingSessions === 0 || isOnChatManagementPage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={handleClick}
        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-all hover:scale-105 animate-fadeIn"
      >
        <span className="animate-blink bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {pendingSessions}
        </span>
        <span>Tin nhắn chờ xử lý</span>
      </button>
    </div>
  );
} 