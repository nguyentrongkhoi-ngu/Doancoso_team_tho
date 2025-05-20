import { NextResponse } from 'next/server';
import { chatHistory } from '../../route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID is required' 
      }, { status: 400 });
    }
    
    // Lấy lịch sử tin nhắn cho phiên chat
    const messages = chatHistory[sessionId];
    
    if (!messages) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chat history not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      messages
    });
  } catch (error) {
    console.error('Chat History API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
} 