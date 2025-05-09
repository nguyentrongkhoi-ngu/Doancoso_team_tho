import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET API để kiểm tra sản phẩm có trong wishlist không
export async function GET(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { isInWishlist: false },
        { status: 200 }
      );
    }
    
    // Lấy ID sản phẩm từ query params
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    
    if (!productId) {
      return NextResponse.json(
        { error: "Thiếu thông tin sản phẩm" },
        { status: 400 }
      );
    }
    
    // Kiểm tra sản phẩm có trong wishlist không
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });
    
    return NextResponse.json({ 
      isInWishlist: !!wishlistItem 
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra wishlist:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi kiểm tra trạng thái wishlist" },
      { status: 500 }
    );
  }
} 