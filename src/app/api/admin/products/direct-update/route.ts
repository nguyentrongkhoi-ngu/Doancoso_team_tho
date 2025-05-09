import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

// Create a direct Prisma instance for this route only
const directPrisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log("Direct database update API called");
  
  try {
    // Parse the request body
    const data = await req.json();
    console.log("Request body:", data);
    
    const { productId, isFeatured } = data;
    
    if (!productId) {
      return NextResponse.json({
        error: "Missing product ID"
      }, { status: 400 });
    }
    
    console.log(`Direct update: Setting product ${productId} featured status to ${isFeatured}`);
    
    // Perform a direct database update
    try {
      const updatedProduct = await directPrisma.product.update({
        where: { id: productId },
        data: { isFeatured: Boolean(isFeatured) },
        select: {
          id: true,
          name: true,
          isFeatured: true
        }
      });
      
      console.log("Database update successful:", updatedProduct);
      
      // Thông báo với client rằng cache nên được làm mới
      const invalidateCache = async () => {
        try {
          console.log("Đang làm mới cache sản phẩm nổi bật...");
          
          // Tạo URL cơ sở
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          
          // Tải lại dữ liệu sản phẩm nổi bật từ API với force-refresh
          const refreshUrl = `${baseUrl}/api/products?featured=true&_ts=${Date.now()}`;
          console.log(`Đang gọi API refresh: ${refreshUrl}`);
          
          const refreshResponse = await fetch(refreshUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Force-Refresh': 'true'
            },
            next: { revalidate: 0 }
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log(`Đã làm mới cache thành công. Nhận được ${refreshData.length} sản phẩm nổi bật.`);
          } else {
            console.error("Lỗi khi làm mới cache:", await refreshResponse.text());
          }
          
          // Thêm một bước làm mới cache bằng cách gọi API với fetch siêu lấy
          console.log("Đang làm mới cache bổ sung...");
          const additionalRefresh = await fetch(`${baseUrl}/api/products/refresh-featured-cache`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-refresh-key'}`
            },
            body: JSON.stringify({ timestamp: Date.now() })
          }).catch(err => {
            console.log("API refresh bổ sung không khả dụng:", err.message);
            return new Response(null, { status: 404 });
          });
          
          if (additionalRefresh.ok) {
            console.log("Đã gọi API làm mới cache bổ sung thành công");
          }
        } catch (error) {
          console.error("Lỗi trong quá trình làm mới cache:", error);
        }
      };
      
      // Gọi hàm xóa cache ở background
      invalidateCache().catch(console.error);
      
      return NextResponse.json({
        success: true,
        message: `Sản phẩm ${updatedProduct.name} ${updatedProduct.isFeatured ? 'đã được' : 'không còn'} đặt làm nổi bật`,
        product: updatedProduct,
        cacheInvalidated: true
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({
        error: "Database error",
        details: dbError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      error: "Server error",
      details: error.message
    }, { status: 500 });
  }
} 