import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET API để lấy danh sách địa chỉ giao hàng của người dùng
export async function GET(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem địa chỉ giao hàng" },
        { status: 401 }
      );
    }
    
    // Lấy danh sách địa chỉ của người dùng
    const addresses = await prisma.userAddress.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
    
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ giao hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tải danh sách địa chỉ giao hàng" },
      { status: 500 }
    );
  }
}

// POST API để thêm địa chỉ giao hàng mới
export async function POST(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thêm địa chỉ giao hàng" },
        { status: 401 }
      );
    }
    
    // Lấy thông tin địa chỉ từ request body
    const addressData = await req.json();
    
    // Kiểm tra dữ liệu đầu vào
    const requiredFields = ['fullName', 'address', 'city', 'country', 'phoneNumber'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return NextResponse.json(
          { error: `Thiếu thông tin: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Nếu là địa chỉ mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
    if (addressData.isDefault) {
      await prisma.userAddress.updateMany({
        where: {
          userId: session.user.id,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    // Kiểm tra nếu đây là địa chỉ đầu tiên của người dùng, tự động đặt làm mặc định
    const addressCount = await prisma.userAddress.count({
      where: {
        userId: session.user.id,
      },
    });
    
    // Thêm địa chỉ mới
    const newAddress = await prisma.userAddress.create({
      data: {
        userId: session.user.id,
        fullName: addressData.fullName,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        phoneNumber: addressData.phoneNumber,
        isDefault: addressData.isDefault || addressCount === 0, // Tự động đặt mặc định nếu là địa chỉ đầu tiên
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Đã thêm địa chỉ giao hàng mới",
      address: newAddress,
    });
  } catch (error) {
    console.error("Lỗi khi thêm địa chỉ giao hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi thêm địa chỉ giao hàng" },
      { status: 500 }
    );
  }
}

// PATCH API để cập nhật địa chỉ giao hàng
export async function PATCH(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để cập nhật địa chỉ giao hàng" },
        { status: 401 }
      );
    }
    
    // Lấy thông tin địa chỉ từ request body
    const { id, ...addressData } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Thiếu ID địa chỉ cần cập nhật" },
        { status: 400 }
      );
    }
    
    // Kiểm tra địa chỉ có tồn tại và thuộc về người dùng hiện tại không
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingAddress) {
      return NextResponse.json(
        { error: "Địa chỉ không tồn tại hoặc không thuộc về bạn" },
        { status: 404 }
      );
    }
    
    // Nếu là địa chỉ mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
    if (addressData.isDefault) {
      await prisma.userAddress.updateMany({
        where: {
          userId: session.user.id,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    // Cập nhật địa chỉ
    const updatedAddress = await prisma.userAddress.update({
      where: {
        id,
      },
      data: addressData,
    });
    
    return NextResponse.json({
      success: true,
      message: "Đã cập nhật địa chỉ giao hàng",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật địa chỉ giao hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật địa chỉ giao hàng" },
      { status: 500 }
    );
  }
}

// DELETE API để xóa địa chỉ giao hàng
export async function DELETE(req: NextRequest) {
  try {
    // Lấy thông tin người dùng đăng nhập
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xóa địa chỉ giao hàng" },
        { status: 401 }
      );
    }
    
    // Lấy ID địa chỉ từ query params
    const url = new URL(req.url);
    const addressId = url.searchParams.get("id");
    
    if (!addressId) {
      return NextResponse.json(
        { error: "Thiếu ID địa chỉ cần xóa" },
        { status: 400 }
      );
    }
    
    // Kiểm tra địa chỉ có tồn tại và thuộc về người dùng hiện tại không
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });
    
    if (!existingAddress) {
      return NextResponse.json(
        { error: "Địa chỉ không tồn tại hoặc không thuộc về bạn" },
        { status: 404 }
      );
    }
    
    // Xóa địa chỉ
    await prisma.userAddress.delete({
      where: {
        id: addressId,
      },
    });
    
    // Nếu địa chỉ đã xóa là mặc định và người dùng còn địa chỉ khác, đặt địa chỉ đầu tiên làm mặc định
    if (existingAddress.isDefault) {
      const remainingAddresses = await prisma.userAddress.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 1,
      });
      
      if (remainingAddresses.length > 0) {
        await prisma.userAddress.update({
          where: {
            id: remainingAddresses[0].id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Đã xóa địa chỉ giao hàng",
    });
  } catch (error) {
    console.error("Lỗi khi xóa địa chỉ giao hàng:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa địa chỉ giao hàng" },
      { status: 500 }
    );
  }
} 