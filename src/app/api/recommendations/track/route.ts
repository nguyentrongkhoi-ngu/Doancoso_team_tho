import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logRecommendationInteraction } from '@/lib/recommendation-engine/recommendation-metrics';

/**
 * API endpoint để ghi lại tương tác với sản phẩm được gợi ý
 */
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem có session hay không (người dùng đã đăng nhập chưa)
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy thông tin từ request body
    const body = await request.json();
    const { productId, recommendationType, interactionType } = body;
    const userId = session.user.id || body.userId;

    if (!userId || !productId || !recommendationType || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Kiểm tra loại tương tác có hợp lệ không
    if (!['view', 'cart', 'purchase'].includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    // Ghi lại tương tác
    const success = await logRecommendationInteraction(
      userId,
      productId,
      recommendationType,
      interactionType as 'view' | 'cart' | 'purchase'
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to log interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging recommendation interaction:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 