import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API endpoint để lấy danh sách sản phẩm phổ biến nhất
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    // Lấy các sản phẩm phổ biến nhất dựa trên số lượt xem
    const popularProducts = await prisma.product.findMany({
      where: {
        stock: { gt: 0 } // Chỉ lấy sản phẩm còn hàng
      },
      orderBy: [
        {
          productViews: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc' // Đảm bảo sản phẩm mới được ưu tiên nếu có cùng lượt xem
        }
      ],
      take: limit,
      include: {
        category: true
      }
    });

    return NextResponse.json(popularProducts);
  } catch (error) {
    console.error('Error getting popular products:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 