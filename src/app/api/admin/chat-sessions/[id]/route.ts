import { NextResponse } from 'next/server';
import { chatSessions, chatHistory } from '../../chat-sessions/route';

// API để cập nhật trạng thái phiên chat
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Status is required' 
      }, { status: 400 });
    }
    
    // Tìm và cập nhật phiên chat
    const sessionIndex = chatSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat session not found' 
      }, { status: 404 });
    }
    
    chatSessions[sessionIndex].status = status as 'active' | 'closed' | 'pending';
    
    // Trong môi trường thực tế, bạn sẽ cập nhật trạng thái trong database
    // await prisma.chatSession.update({
    //   where: { id: id },
    //   data: { status }
    // });
    
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

// API để lấy thông tin chi tiết về một phiên chat
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Tìm phiên chat
    const session = chatSessions.find(session => session.id === id);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat session not found' 
      }, { status: 404 });
    }
    
    // Lấy lịch sử chat
    const messages = chatHistory[id] || [];
    
    return NextResponse.json({ 
      success: true,
      session,
      messages
    });
  } catch (error) {
    console.error('Chat Session Detail API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat session details' 
    }, { status: 500 });
  }
} 