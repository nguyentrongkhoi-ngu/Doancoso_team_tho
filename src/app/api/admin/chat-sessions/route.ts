import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';

// Interface cho phiên chat
export interface ChatSession {
  id: string;
  userId: string | null;
  userName: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  status: 'active' | 'closed' | 'pending';
  messageCount: number;
}

// Lưu trữ phiên chat trong bộ nhớ (trong môi trường production nên sử dụng database)
export let chatSessions: ChatSession[] = [
  {
    id: '1',
    userId: '101',
    userName: 'Nguyễn Văn A',
    lastMessage: 'Tôi muốn biết thêm về sản phẩm này',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    status: 'active',
    messageCount: 5,
  },
  {
    id: '2',
    userId: null,
    userName: 'Khách vãng lai',
    lastMessage: 'Làm thế nào để theo dõi đơn hàng?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'pending',
    messageCount: 3,
  },
  {
    id: '3',
    userId: '203',
    userName: 'Trần Thị B',
    lastMessage: 'Cảm ơn bạn rất nhiều!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'closed',
    messageCount: 12,
  },
];

// Lưu trữ lịch sử tin nhắn cho mỗi phiên chat
const chatHistory: Record<string, Message[]> = {
  '1': [
    {
      role: 'assistant',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      role: 'user',
      content: 'Tôi đang tìm hiểu về sản phẩm điện thoại mới',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      role: 'assistant',
      content: 'Chúng tôi có nhiều mẫu điện thoại mới. Bạn quan tâm đến thương hiệu nào?',
      timestamp: new Date(Date.now() - 1000 * 60 * 8),
    },
    {
      role: 'user',
      content: 'Tôi muốn biết thêm về sản phẩm iPhone mới nhất',
      timestamp: new Date(Date.now() - 1000 * 60 * 6),
    },
    {
      role: 'assistant',
      content: 'iPhone 15 Pro Max là mẫu mới nhất với nhiều tính năng vượt trội như chip A17 Pro, camera 48MP và màn hình ProMotion',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ],
  '2': [
    {
      role: 'assistant',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(Date.now() - 1000 * 60 * 40),
    },
    {
      role: 'user',
      content: 'Tôi vừa đặt hàng nhưng không biết theo dõi đơn hàng ở đâu',
      timestamp: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      role: 'assistant',
      content: 'Bạn có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản và vào mục "Đơn hàng của tôi". Nếu bạn đặt hàng không cần tài khoản, bạn có thể dùng mã đơn hàng và email để tra cứu.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ],
  '3': [
    {
      role: 'assistant',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      role: 'user',
      content: 'Tôi muốn đổi sản phẩm vì bị lỗi',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.9),
    },
    {
      role: 'assistant',
      content: 'Rất tiếc về trải nghiệm của bạn. Bạn có thể mang sản phẩm đến cửa hàng gần nhất hoặc gửi yêu cầu đổi trả online. Bạn đã mua sản phẩm được bao lâu rồi?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8),
    },
    {
      role: 'user',
      content: 'Tôi mới mua 3 ngày trước',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.7),
    },
    {
      role: 'assistant',
      content: 'Trong trường hợp này, bạn đủ điều kiện để đổi sản phẩm mới hoặc hoàn tiền. Bạn có thể làm theo hướng dẫn đổi trả trên website hoặc mang sản phẩm cùng hóa đơn đến cửa hàng.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.6),
    },
    {
      role: 'user',
      content: 'Cảm ơn bạn rất nhiều!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ],
};

// API để lấy danh sách các phiên chat
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filteredSessions = [...chatSessions];
    
    // Lọc theo trạng thái nếu có
    if (status && ['active', 'closed', 'pending'].includes(status)) {
      filteredSessions = filteredSessions.filter(
        session => session.status === status
      );
    }
    
    // Sắp xếp theo thời gian mới nhất
    filteredSessions.sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
    
    return NextResponse.json({ 
      success: true,
      sessions: filteredSessions
    });
  } catch (error) {
    console.error('Chat Sessions API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat sessions' 
    }, { status: 500 });
  }
}

// API để cập nhật trạng thái phiên chat
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID and status are required' 
      }, { status: 400 });
    }
    
    // Cập nhật trạng thái phiên chat
    const sessionIndex = chatSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat session not found' 
      }, { status: 404 });
    }
    
    chatSessions[sessionIndex].status = status as 'active' | 'closed' | 'pending';
    
    return NextResponse.json({ 
      success: true,
      session: chatSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Chat Session Update API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update chat session' 
    }, { status: 500 });
  }
}

// Export chatHistory và chatSessions để có thể sử dụng ở API route khác
export { chatHistory }; 