'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ChatSession } from '@/app/api/admin/chat-sessions/route';
import { Message } from '@/types/chat';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ChatManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = searchParams.get('filter') as 'all' | 'active' | 'pending' | 'closed' || 'all';
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'closed'>(initialFilter);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<{
    totalMessages: number;
    userMessages: number;
    commonKeywords: Record<string, number>;
    lastUpdated: Date | null;
  }>({
    totalMessages: 0,
    userMessages: 0,
    commonKeywords: {},
    lastUpdated: null,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Update URL when filter changes
  useEffect(() => {
    if (filter !== 'all') {
      router.push(`/admin/chat-management?filter=${filter}`);
    } else {
      router.push('/admin/chat-management');
    }
  }, [filter, router]);

  // Fetch chat sessions
  const fetchChatSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/admin/chat-sessions${statusParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convert string dates back to Date objects
        const sessions = data.sessions.map((session: any) => ({
          ...session,
          lastMessageTime: new Date(session.lastMessageTime),
        }));
        
        setChatSessions(sessions);
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching chat sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Tự động làm mới dữ liệu mỗi 30 giây
  useEffect(() => {
    fetchChatSessions();
    
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchChatSessions();
      }, 30000); // 30 giây
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchChatSessions, autoRefresh]);

  // Lấy thống kê chat
  useEffect(() => {
    fetch('/api/admin/chat-statistics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        } else {
          console.error('Failed to fetch chat statistics:', data.error);
        }
      })
      .catch(err => {
        console.error('Error fetching chat statistics:', err);
      });
  }, [lastRefreshed]); // Cập nhật thống kê khi làm mới dữ liệu

  // Lấy lịch sử chat
  const fetchChatHistory = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/admin/chat-sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        // Chuyển đổi timestamp từ string về Date
        const messages = data.messages.map((message: any) => ({
          ...message,
          timestamp: message.timestamp ? new Date(message.timestamp) : undefined,
        }));
        
        setChatHistory(messages);
      } else {
        console.error('Failed to fetch chat history:', data.error);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchChatHistory(selectedSession);
    }
  }, [selectedSession, fetchChatHistory]);

  const formatTime = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Cập nhật trạng thái phiên chat
  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/chat-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Cập nhật danh sách phiên chat
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === sessionId ? { ...session, status: newStatus as any } : session
          )
        );
      } else {
        console.error('Failed to update session status:', data.error);
      }
    } catch (err) {
      console.error('Error updating session status:', err);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'pending' | 'closed') => {
    setFilter(newFilter);
    setSelectedSession(null);
  };

  // Gửi tin nhắn trả lời từ quản trị viên
  const handleSendAdminReply = async () => {
    if (!selectedSession || !adminReply.trim()) return;
    
    setIsSending(true);
    try {
      // Lưu tin nhắn trả lời vào API
      const response = await fetch('/api/chat/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          response: adminReply,
          timestamp: new Date().toISOString(),
          isFromAdmin: true, // Đánh dấu tin nhắn từ quản trị viên
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send admin reply');
      }
      
      // Cập nhật trạng thái phiên chat thành "active"
      await fetch(`/api/admin/chat-sessions/${selectedSession}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });
      
      // Thêm tin nhắn vào lịch sử chat
      const newMessage: Message = {
        role: 'assistant',
        content: adminReply,
        timestamp: new Date(),
        isFromAdmin: true,
      };
      
      setChatHistory(prev => [...prev, newMessage]);
      
      // Cập nhật session trong danh sách
      setChatSessions(prev => 
        prev.map(session => 
          session.id === selectedSession 
            ? { 
                ...session, 
                lastMessage: adminReply,
                lastMessageTime: new Date(),
                status: 'active',
                messageCount: session.messageCount + 1
              } 
            : session
        )
      );
      
      // Xóa nội dung tin nhắn sau khi gửi
      setAdminReply('');
    } catch (err) {
      console.error('Error sending admin reply:', err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  // Xử lý khi nhấn Enter để gửi tin nhắn
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAdminReply();
    }
  };

  const handleRefresh = () => {
    fetchChatSessions();
    if (selectedSession) {
      fetchChatHistory(selectedSession);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý trò chuyện</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="mr-2"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-600">
                Tự động làm mới (30s)
              </label>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              title="Làm mới dữ liệu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => handleFilterChange('all')}
              >
                Tất cả
              </button>
              <button 
                className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => handleFilterChange('active')}
              >
                Đang hoạt động
              </button>
              <button 
                className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => handleFilterChange('pending')}
              >
                Chờ xử lý
              </button>
              <button 
                className={`px-4 py-2 rounded ${filter === 'closed' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => handleFilterChange('closed')}
              >
                Đã đóng
              </button>
            </div>
          </div>
        </div>
        
        {/* Last refreshed indicator */}
        <div className="text-xs text-gray-500 mb-2 text-right">
          Cập nhật lần cuối: {formatTime(lastRefreshed)}
        </div>
        
        {/* Chat Statistics */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Thống kê trò chuyện</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Tổng số tin nhắn</p>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Tin nhắn từ người dùng</p>
              <p className="text-2xl font-bold">{stats.userMessages}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Từ khóa phổ biến</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(stats.commonKeywords)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([keyword, count]) => (
                    <span key={keyword} className="bg-primary bg-opacity-10 text-primary text-xs px-2 py-1 rounded-full">
                      {keyword} ({count})
                    </span>
                  ))}
              </div>
            </div>
          </div>
          {stats.lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Cập nhật lần cuối: {formatTime(stats.lastUpdated)}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Chat Sessions Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">Danh sách trò chuyện</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {chatSessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Không có cuộc trò chuyện nào
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {chatSessions.map((session) => (
                        <li 
                          key={session.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedSession === session.id ? 'bg-primary bg-opacity-5 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{session.userName || 'Khách vãng lai'}</p>
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">{session.lastMessage}</p>
                            </div>
                            <span className={`px-2 text-xs leading-5 font-semibold rounded-full 
                              ${session.status === 'active' ? 'bg-green-100 text-green-800' : 
                                session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {session.status === 'active' ? 'Đang hoạt động' : 
                               session.status === 'pending' ? 'Chờ xử lý' : 'Đã đóng'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">{formatTime(session.lastMessageTime)}</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{session.messageCount} tin nhắn</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            {/* Chat History */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-md rounded-lg overflow-hidden h-full">
                <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                  <h3 className="font-medium">
                    {selectedSession 
                      ? `Lịch sử trò chuyện - ${chatSessions.find(s => s.id === selectedSession)?.userName || 'Khách vãng lai'}`
                      : 'Chọn một cuộc trò chuyện để xem lịch sử'}
                  </h3>
                  {selectedSession && (
                    <div className="flex gap-2">
                      {chatSessions.find(s => s.id === selectedSession)?.status !== 'closed' ? (
                        <button 
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={() => handleStatusChange(selectedSession, 'closed')}
                        >
                          Đóng
                        </button>
                      ) : (
                        <button 
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={() => handleStatusChange(selectedSession, 'active')}
                        >
                          Mở lại
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-4 h-[550px] overflow-y-auto bg-gray-50">
                  {!selectedSession ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chọn một cuộc trò chuyện để xem lịch sử
                    </div>
                  ) : isLoadingHistory ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-white'
                                : message.isFromAdmin 
                                  ? 'bg-green-100 text-gray-800 border border-green-200'
                                  : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            {message.role !== 'user' && message.isFromAdmin && (
                              <div className="text-xs text-green-600 font-medium mb-1">Admin</div>
                            )}
                            <p>{message.content}</p>
                            {message.timestamp && (
                              <p className={`text-xs mt-1 ${
                                message.role === 'user' ? 'text-gray-200' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Admin Reply Input */}
                {selectedSession && chatSessions.find(s => s.id === selectedSession)?.status !== 'closed' && (
                  <div className="border-t p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập tin nhắn trả lời..."
                        className="flex-1 resize-none rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[100px] overflow-y-auto"
                        disabled={isSending}
                        rows={1}
                      />
                      <button
                        onClick={handleSendAdminReply}
                        disabled={isSending || !adminReply.trim()}
                        className="bg-primary text-white rounded-full p-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                        aria-label="Gửi"
                      >
                        {isSending ? (
                          <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 