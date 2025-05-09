import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// API để lấy các sản phẩm đã xem gần đây
export async function GET(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem sản phẩm đã xem gần đây" },
        { status: 401 }
      );
    }
    
    // Lấy tham số limit từ URL, mặc định là 10
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    // Lấy danh sách sản phẩm đã xem gần đây
    const recentlyViewed = await prisma.productView.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc", // Sắp xếp theo thời gian xem gần nhất
      },
      take: limit,
      include: {
        product: {
          include: {
            category: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });
    
    // Tính toán rating trung bình cho mỗi sản phẩm
    const recentlyViewedWithRatings = recentlyViewed.map((view) => {
      const reviews = view.product.reviews || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
      
      return {
        viewId: view.id,
        productId: view.productId,
        viewCount: view.viewCount,
        lastViewed: view.updatedAt,
        product: {
          ...view.product,
          averageRating,
          reviews: undefined, // Loại bỏ mảng reviews gốc
        },
      };
    });
    
    return NextResponse.json({ recentlyViewed: recentlyViewedWithRatings });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm đã xem gần đây:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải danh sách sản phẩm đã xem gần đây" },
      { status: 500 }
    );
  }
} 