import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { chatSessions } from '../../admin/chat-sessions/route';

export async function POST(request: Request) {
  try {
    const { messages, userName, userId } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Messages are required and must be an array' 
      }, { status: 400 });
    }
    
    // Tạo ID phiên chat mới
    const sessionId = uuidv4();
    
    // Lấy tin nhắn cuối cùng
    let lastMessage = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastMessage = messages[i].content;
        break;
      }
    }
    
    if (!lastMessage) {
      lastMessage = 'Bắt đầu cuộc trò chuyện mới';
    }
    
    // Tạo phiên chat mới
    const newSession = {
      id: sessionId,
      userId: userId || null,
      userName: userName || 'Khách vãng lai',
      lastMessage,
      lastMessageTime: new Date(),
      status: 'active' as const,
      messageCount: messages.length,
    };
    
    // Thêm phiên chat vào danh sách
    chatSessions.push(newSession);
    
    // Trong môi trường thực tế, bạn sẽ lưu phiên chat vào database
    // await prisma.chatSession.create({
    //   data: newSession
    // });
    
    return NextResponse.json({ 
      success: true,
      sessionId,
      session: newSession
    });
  } catch (error) {
    console.error('Chat Session API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create chat session' 
    }, { status: 500 });
  }
} 