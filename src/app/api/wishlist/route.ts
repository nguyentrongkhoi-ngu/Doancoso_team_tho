import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET API để lấy danh sách wishlist
export async function GET(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem wishlist" },
        { status: 401 }
      );
    }
    
    // Lấy danh sách wishlist của người dùng
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id,
      },
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
      orderBy: {
        addedAt: "desc",
      },
    });
    
    // Tính toán rating trung bình cho mỗi sản phẩm
    const wishlistWithRatings = wishlistItems.map((item) => {
      const reviews = item.product.reviews || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
      
      return {
        id: item.id,
        productId: item.productId,
        addedAt: item.addedAt,
        product: {
          ...item.product,
          averageRating,
          reviews: undefined, // Loại bỏ mảng reviews gốc
        },
      };
    });
    
    return NextResponse.json({ wishlistItems: wishlistWithRatings });
  } catch (error) {
    console.error("Lỗi khi lấy wishlist:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải danh sách wishlist" },
      { status: 500 }
    );
  }
}

// POST API để thêm sản phẩm vào wishlist
export async function POST(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thêm sản phẩm vào wishlist" },
        { status: 401 }
      );
    }
    
    // Lấy thông tin sản phẩm từ request body
    const { productId } = await req.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: "Thiếu thông tin sản phẩm" },
        { status: 400 }
      );
    }
    
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }
    
    // Kiểm tra xem sản phẩm đã có trong wishlist chưa
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });
    
    if (existingItem) {
      return NextResponse.json(
        { error: "Sản phẩm đã có trong wishlist" },
        { status: 400 }
      );
    }
    
    // Thêm sản phẩm vào wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Đã thêm sản phẩm vào wishlist",
      wishlistItem,
    });
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào wishlist:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi thêm sản phẩm vào wishlist" },
      { status: 500 }
    );
  }
}

// DELETE API để xóa sản phẩm khỏi wishlist
export async function DELETE(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xóa sản phẩm khỏi wishlist" },
        { status: 401 }
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
    
    // Xóa sản phẩm khỏi wishlist
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Đã xóa sản phẩm khỏi wishlist",
    });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi wishlist:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa sản phẩm khỏi wishlist" },
      { status: 500 }
    );
  }
} 