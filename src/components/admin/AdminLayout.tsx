'use client';

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ChatNotifications from "./ChatNotifications";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingChats, setPendingChats] = useState(0);

  // Fetch pending chats count
  useEffect(() => {
    async function fetchPendingChats() {
      try {
        const response = await fetch('/api/admin/chat-sessions?status=pending');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPendingChats(data.sessions.length);
          }
        }
      } catch (err) {
        console.error('Error fetching pending chats:', err);
      }
    }
    
    fetchPendingChats();
    
    // Refresh every minute
    const interval = setInterval(fetchPendingChats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Redirect if not an admin (this is a backup for the middleware)
  if (!isLoading && !isAdmin) {
    router.push('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if a nav link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="text-xl font-bold mb-6">Quản Trị Hệ Thống</div>
        <nav className="space-y-2">
          <Link 
            href="/admin" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Tổng Quan
          </Link>
          <Link 
            href="/admin/users" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin/users') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Quản Lý Người Dùng
          </Link>
          <Link 
            href="/admin/categories" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin/categories') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Quản Lý Danh Mục
          </Link>
          <Link 
            href="/admin/products" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin/products') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Quản Lý Sản Phẩm
          </Link>
          <Link 
            href="/admin/orders" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin/orders') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Quản Lý Đơn Hàng
          </Link>
          <Link 
            href="/admin/coupons" 
            className={`block p-2 rounded transition-colors ${
              isActive('/admin/coupons') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            Quản Lý Mã Giảm Giá
          </Link>
          <Link 
            href="/admin/chat-management" 
            className={`flex items-center justify-between p-2 rounded transition-colors ${
              isActive('/admin/chat-management') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
            }`}
          >
            <span>Quản Lý Trò Chuyện</span>
            {pendingChats > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingChats}
              </span>
            )}
          </Link>
          <Link 
            href="/" 
            className="block p-2 rounded hover:bg-gray-700 transition-colors mt-8"
          >
            Quay Lại Website
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
      
      {/* Show chat notifications only when not on chat management page */}
      {!isActive('/admin/chat-management') && <ChatNotifications />}
    </div>
  );
} 