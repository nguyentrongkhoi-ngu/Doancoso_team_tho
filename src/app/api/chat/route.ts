import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';
import { chatSessions, chatHistory } from '../admin/chat-sessions/route';
import { logger } from '@/lib/logger';

// Interface cho thống kê chat
interface ChatStats {
  totalMessages: number;
  userMessages: number;
  commonKeywords: Record<string, number>;
  lastUpdated: Date;
}

// Lưu trữ thống kê chat trong bộ nhớ (trong môi trường production nên sử dụng database)
let chatStats: ChatStats = {
  totalMessages: 0,
  userMessages: 0,
  commonKeywords: {},
  lastUpdated: new Date()
};

// Các từ khóa cần theo dõi
const TRACKED_KEYWORDS = [
  'đơn hàng', 'vận chuyển', 'đổi trả', 'thanh toán', 'giá',
  'khuyến mãi', 'sản phẩm', 'liên hệ', 'bảo hành'
];

// Cập nhật thống kê dựa trên tin nhắn
function updateStats(message: string) {
  chatStats.totalMessages++;
  chatStats.userMessages++;
  chatStats.lastUpdated = new Date();

  // Đếm từ khóa phổ biến
  const lowerMessage = message.toLowerCase();
  TRACKED_KEYWORDS.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      chatStats.commonKeywords[keyword] = (chatStats.commonKeywords[keyword] || 0) + 1;
    }
  });
}

// API để lưu tin nhắn và cập nhật thống kê
export async function POST(request: Request) {
  try {
    const { message, messages, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Cập nhật thống kê
    updateStats(message);

    // Log chat activity
    logger.info('Chat message received', { message: message.substring(0, 100) });

    // Log statistics periodically
    if (chatStats.totalMessages % 10 === 0) {
      logger.info('Chat statistics', chatStats);
    }

    // Nếu có sessionId, cập nhật lịch sử chat và thông tin phiên chat
    if (sessionId) {
      // Tìm phiên chat
      const sessionIndex = chatSessions.findIndex(session => session.id === sessionId);

      if (sessionIndex !== -1) {
        // Cập nhật thông tin phiên chat
        chatSessions[sessionIndex].lastMessage = message;
        chatSessions[sessionIndex].lastMessageTime = new Date();
        chatSessions[sessionIndex].messageCount = messages.length;

        // Lưu tin nhắn vào lịch sử chat
        if (!chatHistory[sessionId]) {
          chatHistory[sessionId] = [];
        }

        // Thêm tin nhắn người dùng
        chatHistory[sessionId].push({
          role: 'user',
          content: message,
          timestamp: new Date(),
        });

        // TODO: Implement AI response and database persistence
        // In production, save to database using Prisma
      }
    }

    // Trả về thành công
    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: chatStats.totalMessages,
        mostCommonKeyword: getMostCommonKeyword()
      }
    });
  } catch (error) {
    logger.error('Chat API Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat message'
      },
      { status: 500 }
    );
  }
}

// API để lấy thống kê chat (có thể sử dụng cho dashboard admin)
export async function GET() {
  return NextResponse.json({ stats: chatStats });
}

// Hàm hỗ trợ để lấy từ khóa phổ biến nhất
function getMostCommonKeyword(): string {
  let maxCount = 0;
  let mostCommon = '';

  Object.entries(chatStats.commonKeywords).forEach(([keyword, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = keyword;
    }
  });

  return mostCommon;
}