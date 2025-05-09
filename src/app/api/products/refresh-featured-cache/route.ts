import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

// API để làm mới cache sản phẩm nổi bật
export async function POST(req: NextRequest) {
  try {
    // Kiểm tra authorization
    const authHeader = req.headers.get('Authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-refresh-key';
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== internalKey) {
      console.log("Unauthorized attempt to refresh featured products cache");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("API: Đang làm mới cache sản phẩm nổi bật từ yêu cầu nội bộ");
    
    // Lấy timestamp từ request body
    const data = await req.json();
    const timestamp = data.timestamp || Date.now();
    
    // Truy vấn trực tiếp dữ liệu sản phẩm nổi bật từ database
    const featuredProducts = await prisma.product.findMany({
      where: {
        isFeatured: true
      },
      include: {
        category: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`API: Đã tải ${featuredProducts.length} sản phẩm nổi bật từ database`);
    featuredProducts.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id}, Cập nhật: ${product.updatedAt})`);
    });
    
    // Có thể thêm logic để lưu cache hoặc làm mới bộ nhớ đệm nếu cần
    
    return NextResponse.json({
      success: true,
      message: `Đã làm mới cache cho ${featuredProducts.length} sản phẩm nổi bật`,
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
    console.error("Lỗi khi làm mới cache sản phẩm nổi bật:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi làm mới cache", message: (error as Error).message },
      { status: 500 }
    );
  }
} 