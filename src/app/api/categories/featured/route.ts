import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Cập nhật trạng thái nổi bật của danh mục
export async function PUT(req: NextRequest) {
  console.log('API PUT /api/categories/featured đang được gọi');
  
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    console.log('Dữ liệu nhận được:', data);
    
    if (!data.id) {
      return NextResponse.json(
        { error: "ID danh mục là bắt buộc" },
        { status: 400 }
      );
    }
    
    // Đặt giá trị isFeatured
    const isFeatured = data.isFeatured === true;
    
    try {
      // Kiểm tra xem danh mục có tồn tại không
      const category = await prisma.category.findUnique({
        where: { id: data.id },
      });
      
      if (!category) {
        return NextResponse.json(
          { error: "Danh mục không tồn tại" },
          { status: 404 }
        );
      }
      
      // Cập nhật trạng thái nổi bật
      const updatedCategory = await prisma.category.update({
        where: { id: data.id },
        data: { isFeatured },
      });
      
      return NextResponse.json({
        category: updatedCategory,
        message: `Đã ${isFeatured ? 'đánh dấu' : 'bỏ đánh dấu'} danh mục nổi bật`
      });
    } catch (dbError: any) {
      console.error("Lỗi database:", dbError);
      return NextResponse.json(
        {
          error: "Lỗi cơ sở dữ liệu khi cập nhật danh mục",
          details: dbError.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    return NextResponse.json(
      {
        error: "Đã xảy ra lỗi khi cập nhật danh mục",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 