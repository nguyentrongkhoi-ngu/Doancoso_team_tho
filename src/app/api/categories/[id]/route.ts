import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Schema xác thực danh mục
const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isFeatured: z.boolean().optional(),
});

// Lấy thông tin danh mục theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API GET /api/categories/[id] đang được gọi, ID:', params.id);
  
  try {
    const { id } = params;

    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    console.log('Category được tìm thấy:', category ? 'yes' : 'no');

    if (!category) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin danh mục:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy thông tin danh mục" },
      { status: 500 }
    );
  }
}

// Cập nhật danh mục
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API PUT /api/categories/[id] đang được gọi, ID:', params.id);
  
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền admin
    if (!session || session.user.role !== "ADMIN") {
      console.log('Không có quyền truy cập:', session?.user);
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
    
    const { id } = params;
    const data = await req.json();
    console.log('Dữ liệu cập nhật:', data);
    
    // Xác thực dữ liệu
    const validationResult = categoryUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      console.log('Lỗi validation:', validationResult.error.errors);
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Kiểm tra xem danh mục có tồn tại không
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 }
      );
    }
    
    // Cập nhật danh mục
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId === "none" ? null : data.parentId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
      },
    });
    
    console.log('Danh mục sau khi cập nhật:', updatedCategory);
    
    return NextResponse.json({
      category: updatedCategory,
      message: "Đã cập nhật danh mục thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật danh mục" },
      { status: 500 }
    );
  }
}

// Xóa danh mục
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API DELETE /api/categories/[id] đang được gọi, ID:', params.id);
  
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền admin
    if (!session || session.user.role !== "ADMIN") {
      console.log('Không có quyền truy cập:', session?.user);
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
    
    const { id } = params;
    console.log('Delete category ID:', id);
    
    // Kiểm tra xem danh mục có tồn tại không
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
        subCategories: {
          select: { id: true },
          take: 1,
        },
      },
    });
    
    console.log('Category tồn tại:', existingCategory ? 'yes' : 'no');
    console.log('Có sản phẩm:', existingCategory?.products.length ? 'yes' : 'no');
    console.log('Có danh mục con:', existingCategory?.subCategories.length ? 'yes' : 'no');
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 }
      );
    }
    
    // Kiểm tra xem danh mục có chứa sản phẩm không
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục đang chứa sản phẩm" },
        { status: 400 }
      );
    }
    
    // Kiểm tra xem danh mục có chứa danh mục con không
    if (existingCategory.subCategories.length > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục đang chứa danh mục con. Hãy xóa các danh mục con trước." },
        { status: 400 }
      );
    }
    
    // Xóa danh mục
    await prisma.category.delete({
      where: { id },
    });
    
    console.log('Đã xóa danh mục ID:', id);
    
    return NextResponse.json({
      message: "Đã xóa danh mục thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa danh mục" },
      { status: 500 }
    );
  }
} 