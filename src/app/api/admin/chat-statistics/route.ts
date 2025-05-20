import { NextResponse } from 'next/server';
import { chatSessions, chatHistory } from '../chat-sessions/route';

// Hàm phân tích từ khóa từ nội dung tin nhắn
function extractKeywords(content: string): string[] {
  // Loại bỏ dấu câu và chuyển thành chữ thường
  const cleanedContent = content.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Tách thành các từ
  const words = cleanedContent.split(/\s+/);
  
  // Lọc các từ có ít nhất 3 ký tự và không phải là stopwords
  const stopwords = ['và', 'hoặc', 'nhưng', 'vì', 'nên', 'của', 'cho', 'với', 'các', 'những', 'này', 'đó', 'thì', 'mà', 'là', 'có', 'không'];
  
  return words.filter(word => word.length >= 3 && !stopwords.includes(word));
}

export async function GET() {
  try {
    let totalMessages = 0;
    let userMessages = 0;
    let assistantMessages = 0;
    let activeSessions = 0;
    let pendingSessions = 0;
    let closedSessions = 0;
    const keywords: Record<string, number> = {};

    // Đếm số phiên chat theo trạng thái
    chatSessions.forEach(session => {
      if (session.status === 'active') activeSessions++;
      else if (session.status === 'pending') pendingSessions++;
      else if (session.status === 'closed') closedSessions++;
    });

    // Phân tích tin nhắn và từ khóa
    Object.values(chatHistory).forEach(messages => {
      totalMessages += messages.length;
      
      messages.forEach(message => {
        if (message.role === 'user') {
          userMessages++;
          
          // Trích xuất từ khóa từ tin nhắn người dùng
          const messageKeywords = extractKeywords(message.content);
          messageKeywords.forEach(keyword => {
            keywords[keyword] = (keywords[keyword] || 0) + 1;
          });
        } else {
          assistantMessages++;
        }
      });
    });

    // Sắp xếp từ khóa theo số lần xuất hiện
    const commonKeywords = Object.fromEntries(
      Object.entries(keywords)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10)
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalMessages,
        userMessages,
        assistantMessages,
        activeSessions,
        pendingSessions,
        closedSessions,
        commonKeywords,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Chat Statistics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat statistics' },
      { status: 500 }
    );
  }
} 