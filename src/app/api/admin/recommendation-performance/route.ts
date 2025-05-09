import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getRecommendationPerformanceReport, calculateRecommendationPerformance } from '@/lib/recommendation-engine/recommendation-metrics';

/**
 * API endpoint để lấy báo cáo hiệu suất gợi ý sản phẩm
 * Chỉ dành cho admin
 */
export async function GET(request: NextRequest) {
  try {
    // Kiểm tra quyền admin
    const session = await getServerSession();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Lấy period từ query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' || 'week';

    // Lấy báo cáo hiệu suất
    const report = await getRecommendationPerformanceReport(period);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error getting recommendation performance report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint để cập nhật thủ công báo cáo hiệu suất gợi ý sản phẩm
 * Chỉ dành cho admin
 */
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra quyền admin
    const session = await getServerSession();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Lấy thông tin từ request body
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate' },
        { status: 400 }
      );
    }

    // Cập nhật báo cáo hiệu suất
    const performanceData = await calculateRecommendationPerformance(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      message: 'Performance data updated successfully',
      data: performanceData
    });
  } catch (error) {
    console.error('Error updating recommendation performance data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 