'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ChatStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  activeSessions: number;
  pendingSessions: number;
  closedSessions: number;
  commonKeywords: Record<string, number>;
  lastUpdated: Date | null;
}

export default function ChatStatistics() {
  const [stats, setStats] = useState<ChatStats>({
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
    activeSessions: 0,
    pendingSessions: 0,
    closedSessions: 0,
    commonKeywords: {},
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch chat statistics
        const response = await fetch('/api/admin/chat-statistics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat statistics');
        }
        
        const data = await response.json();
        
        if (data.success && data.stats) {
          setStats({
            ...data.stats,
            lastUpdated: data.stats.lastUpdated ? new Date(data.stats.lastUpdated) : null,
          });
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching chat statistics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Lỗi</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Thống kê trò chuyện</h2>
        <span className="text-xs text-gray-500">
          {stats.lastUpdated && `Cập nhật lần cuối: ${formatTime(stats.lastUpdated)}`}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-500">Tổng số tin nhắn</p>
          <p className="text-2xl font-bold">{stats.totalMessages}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-sm text-gray-500">Tin nhắn từ người dùng</p>
          <p className="text-2xl font-bold">{stats.userMessages}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <p className="text-sm text-gray-500">Phiên đang hoạt động</p>
          <p className="text-2xl font-bold">{stats.activeSessions}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p className="text-sm text-gray-500">Phiên chờ xử lý</p>
          <p className="text-2xl font-bold">{stats.pendingSessions}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Từ khóa phổ biến</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.commonKeywords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([keyword, count]) => (
              <span 
                key={keyword} 
                className="bg-primary bg-opacity-10 text-primary text-sm px-3 py-1 rounded-full"
                title={`${count} lần được nhắc đến`}
              >
                {keyword} ({count})
              </span>
            ))}
          
          {Object.keys(stats.commonKeywords).length === 0 && (
            <p className="text-gray-500">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
} 