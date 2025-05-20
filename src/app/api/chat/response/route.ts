import { NextResponse } from 'next/server';
import { chatSessions, chatHistory } from '../../admin/chat-sessions/route';

export async function POST(request: Request) {
  try {
    const { sessionId, response, timestamp, isFromAdmin } = await request.json();
    
    if (!sessionId || !response) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID and response are required' 
      }, { status: 400 });
    }
    
    // Tìm phiên chat
    const sessionIndex = chatSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat session not found' 
      }, { status: 404 });
    }
    
    // Lưu tin nhắn trả lời vào lịch sử chat
    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [];
    }
    
    // Thêm tin nhắn trả lời
    chatHistory[sessionId].push({
      role: 'assistant',
      content: response,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isFromAdmin: isFromAdmin || false, // Đánh dấu nếu tin nhắn từ quản trị viên
    });
    
    // Cập nhật thông tin phiên chat
    chatSessions[sessionIndex].messageCount = chatHistory[sessionId].length;
    chatSessions[sessionIndex].lastMessage = response;
    chatSessions[sessionIndex].lastMessageTime = timestamp ? new Date(timestamp) : new Date();
    
    // Nếu tin nhắn từ quản trị viên, cập nhật trạng thái phiên chat thành "active"
    if (isFromAdmin) {
      chatSessions[sessionIndex].status = 'active';
    }
    
    // Trong môi trường thực tế, bạn sẽ lưu tin nhắn vào database
    // await prisma.chatMessage.create({
    //   data: {
    //     content: response,
    //     role: 'assistant',
    //     timestamp: new Date(),
    //     sessionId: sessionId,
    //     isFromAdmin: isFromAdmin || false,
    //   }
    // });
    
    return NextResponse.json({ 
      success: true,
      messageId: chatHistory[sessionId].length - 1
    });
  } catch (error) {
    console.error('Chat Response API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save response' 
    }, { status: 500 });
  }
} 