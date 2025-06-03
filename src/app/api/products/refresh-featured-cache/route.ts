import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

// API để làm mới cache sản phẩm được xem nhiều nhất
export async function POST(req: NextRequest) {
  try {
    // Kiểm tra authorization
    const authHeader = req.headers.get('Authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-refresh-key';

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== internalKey) {
      console.log("Unauthorized attempt to refresh most viewed products cache");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API: Đang làm mới cache sản phẩm được xem nhiều nhất từ yêu cầu nội bộ");
    
    // Lấy timestamp từ request body
    const data = await req.json();
    const timestamp = data.timestamp || Date.now();
    
    // Truy vấn sản phẩm có lượt xem cao nhất thay vì dựa vào isFeatured
    const topViewedProducts = await prisma.productView.groupBy({
      by: ['productId'],
      _sum: {
        viewCount: true,
      },
      orderBy: {
        _sum: {
          viewCount: 'desc',
        },
      },
      take: 10,
    });

    const topProductIds = topViewedProducts.map(item => item.productId);

    let featuredProducts = [];
    if (topProductIds.length > 0) {
      featuredProducts = await prisma.product.findMany({
        where: {
          id: { in: topProductIds }
        },
        include: {
          category: true
        }
      });

      // Sắp xếp theo thứ tự lượt xem
      const viewOrderMap = new Map(
        topViewedProducts.map((item, index) => [item.productId, index])
      );
      featuredProducts.sort((a, b) => {
        const orderA = viewOrderMap.get(a.id) ?? 999;
        const orderB = viewOrderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    } else {
      // Fallback về sản phẩm mới nhất nếu không có lượt xem
      featuredProducts = await prisma.product.findMany({
        take: 10,
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    
    console.log(`API: Đã tải ${featuredProducts.length} sản phẩm được xem nhiều nhất từ database`);
    featuredProducts.forEach((product, index) => {
      const viewInfo = topViewedProducts.find(v => v.productId === product.id);
      const totalViews = viewInfo?._sum.viewCount || 0;
      console.log(`${index + 1}. ${product.name} (ID: ${product.id}, Lượt xem: ${totalViews})`);
    });

    // Có thể thêm logic để lưu cache hoặc làm mới bộ nhớ đệm nếu cần

    return NextResponse.json({
      success: true,
      message: `Đã làm mới cache cho ${featuredProducts.length} sản phẩm được xem nhiều nhất`,
      timestamp: timestamp,
      refreshTime: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Lỗi khi làm mới cache sản phẩm được xem nhiều nhất:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi làm mới cache", message: (error as Error).message },
      { status: 500 }
    );
  }
}