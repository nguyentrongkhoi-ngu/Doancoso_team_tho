import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/db";
import { authOptions } from "@/lib/auth";

// Helper function để so sánh ngày mà không quan tâm đến giờ
function isCouponDateValid(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return today >= start && today <= end;
}

// Lấy giỏ hàng của người dùng hiện tại
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Bạn cần đăng nhập để truy cập giỏ hàng",
          code: "UNAUTHENTICATED",
          message: "Vui lòng đăng nhập hoặc đăng ký để sử dụng tính năng giỏ hàng"
        },
        { status: 401 }
      );
    }

    // Kiểm tra xem có coupon code được truyền vào không
    const { searchParams } = new URL(req.url);
    const couponCode = searchParams.get('couponCode');

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Tính tổng giá trị giỏ hàng
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    let discount = 0;
    let appliedCoupon = null;

    // Nếu có mã giảm giá, kiểm tra và tính toán số tiền giảm giá
    if (couponCode) {
      console.log("GET cart - Checking coupon:", couponCode);

      let coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
        },
      });

      console.log("GET cart - Found coupon:", coupon ? {
        id: coupon.id,
        code: coupon.code,
        isActive: coupon.isActive,
        startDate: coupon.startDate,
        endDate: coupon.endDate
      } : null);

      // Kiểm tra ngày tháng nếu tìm thấy coupon
      if (coupon && !isCouponDateValid(coupon.startDate, coupon.endDate)) {
        console.log("GET cart - Coupon date validation failed");
        // Không áp dụng mã giảm giá nếu không hợp lệ về ngày tháng
        coupon = null;
      }

      if (coupon) {
        // Kiểm tra giới hạn sử dụng
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          return NextResponse.json(
            { error: "Mã giảm giá đã hết lượt sử dụng" },
            { status: 400 }
          );
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          return NextResponse.json(
            { 
              error: `Giá trị đơn hàng tối thiểu để sử dụng mã giảm giá là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.minOrderAmount)}` 
            },
            { status: 400 }
          );
        }

        // Tính toán số tiền giảm giá
        if (coupon.discountPercent) {
          discount = (subtotal * coupon.discountPercent) / 100;
          // Kiểm tra giới hạn số tiền giảm tối đa
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else if (coupon.discountAmount) {
          discount = coupon.discountAmount;
        }

        appliedCoupon = {
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          discountAmount: coupon.discountAmount,
          discountValue: discount
        };
      }
    }

    const total = subtotal - discount;

    return NextResponse.json({
      items: cartItems,
      subtotal,
      discount,
      total,
      appliedCoupon
    });
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy giỏ hàng" },
      { status: 500 }
    );
  }
}

// Thêm sản phẩm vào giỏ hàng
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
          code: "UNAUTHENTICATED",
          message: "Vui lòng đăng nhập hoặc đăng ký để thêm sản phẩm vào giỏ hàng"
        },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Thiếu mã sản phẩm" },
        { status: 400 }
      );
    }

    // Kiểm tra sản phẩm có tồn tại và còn hàng
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Sản phẩm không đủ số lượng" },
        { status: 400 }
      );
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Cập nhật số lượng nếu sản phẩm đã tồn tại trong giỏ hàng
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          quantity,
        },
        include: {
          product: true,
        },
      });
    }

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi thêm vào giỏ hàng" },
      { status: 500 }
    );
  }
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Bạn cần đăng nhập để cập nhật giỏ hàng",
          code: "UNAUTHENTICATED",
          message: "Vui lòng đăng nhập hoặc đăng ký để sử dụng tính năng giỏ hàng"
        },
        { status: 401 }
      );
    }

    const { cartItemId, quantity } = await req.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Thiếu thông tin cần thiết" },
        { status: 400 }
      );
    }

    // Kiểm tra sản phẩm trong giỏ hàng có thuộc về người dùng hiện tại
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại trong giỏ hàng" },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      // Xóa sản phẩm khỏi giỏ hàng nếu số lượng <= 0
      await prisma.cartItem.delete({
        where: {
          id: cartItemId,
        },
      });

      return NextResponse.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    }

    // Kiểm tra số lượng tồn kho
    if (cartItem.product.stock < quantity) {
      return NextResponse.json(
        { error: "Sản phẩm không đủ số lượng" },
        { status: 400 }
      );
    }

    // Cập nhật số lượng
    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(updatedCartItem);
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật giỏ hàng" },
      { status: 500 }
    );
  }
}

// API áp dụng mã giảm giá
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Bạn cần đăng nhập để áp dụng mã giảm giá",
          code: "UNAUTHENTICATED",
          message: "Vui lòng đăng nhập hoặc đăng ký để sử dụng tính năng mã giảm giá"
        },
        { status: 401 }
      );
    }

    const { couponCode } = await req.json();

    if (!couponCode) {
      return NextResponse.json(
        { error: "Vui lòng nhập mã giảm giá" },
        { status: 400 }
      );
    }

    // Chuẩn hóa mã giảm giá thành chữ hoa
    const normalizedCouponCode = couponCode.trim().toUpperCase();

    console.log("Searching for coupon with code:", normalizedCouponCode);

    // Tìm mã giảm giá theo code và trạng thái active
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: normalizedCouponCode,
        isActive: true,
      },
    });

    console.log("Found coupon by code and active status:", coupon ? {
      id: coupon.id,
      code: coupon.code,
      isActive: coupon.isActive,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      usageCount: coupon.usageCount,
      usageLimit: coupon.usageLimit
    } : null);

    // Kiểm tra ngày tháng nếu tìm thấy coupon
    if (coupon && !isCouponDateValid(coupon.startDate, coupon.endDate)) {
      console.log("Coupon date validation failed");
      // Kiểm tra chi tiết lý do
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(coupon.startDate.getFullYear(), coupon.startDate.getMonth(), coupon.startDate.getDate());
      const end = new Date(coupon.endDate.getFullYear(), coupon.endDate.getMonth(), coupon.endDate.getDate());

      console.log("Date comparison:", { today, start, end });

      if (today < start) {
        return NextResponse.json(
          { error: "Mã giảm giá chưa có hiệu lực" },
          { status: 400 }
        );
      } else if (today > end) {
        return NextResponse.json(
          { error: "Mã giảm giá đã hết hạn" },
          { status: 400 }
        );
      }
    }

    if (!coupon) {
      // Kiểm tra xem mã có tồn tại không (bất kể trạng thái)
      const existingCoupon = await prisma.coupon.findFirst({
        where: { code: normalizedCouponCode }
      });

      if (!existingCoupon) {
        return NextResponse.json(
          { error: "Mã giảm giá không tồn tại" },
          { status: 404 }
        );
      } else if (!existingCoupon.isActive) {
        return NextResponse.json(
          { error: "Mã giảm giá đã bị vô hiệu hóa" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Mã giảm giá không hợp lệ" },
          { status: 400 }
        );
      }
    }

    // Kiểm tra giới hạn sử dụng
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Mã giảm giá đã hết lượt sử dụng" },
        { status: 400 }
      );
    }

    // Lấy giỏ hàng để kiểm tra giá trị tối thiểu
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    });

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { 
          error: `Giá trị đơn hàng tối thiểu để sử dụng mã giảm giá là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.minOrderAmount)}` 
        },
        { status: 400 }
      );
    }

    // Tính toán số tiền giảm giá
    let discount = 0;
    if (coupon.discountPercent) {
      discount = (subtotal * coupon.discountPercent) / 100;
      // Kiểm tra giới hạn số tiền giảm tối đa
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    }

    const total = subtotal - discount;
    
    // Tạo đối tượng appliedCoupon để trả về giống như phương thức GET
    const appliedCoupon = {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount,
      discountValue: discount
    };

    return NextResponse.json({
      items: cartItems,
      subtotal,
      discount,
      total,
      appliedCoupon
    });
  } catch (error) {
    console.error("Lỗi khi áp dụng mã giảm giá:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi áp dụng mã giảm giá" },
      { status: 500 }
    );
  }
} 