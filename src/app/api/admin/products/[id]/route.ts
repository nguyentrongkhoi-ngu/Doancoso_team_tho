import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPermission } from "@/lib/permissions";

// Lấy chi tiết sản phẩm theo ID (Admin only)
async function getProductById(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json(
        { error: "Thiếu ID sản phẩm" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy chi tiết sản phẩm" },
      { status: 500 }
    );
  }
}

// Cập nhật thông tin sản phẩm (Admin only)
async function updateProduct(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    console.log(`Attempting to update product with ID: ${productId}`);
    
    // Parse the request body safely
    let data;
    try {
      data = await req.json();
      console.log(`Update data received:`, data);
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }
    
    // Kiểm tra sản phẩm tồn tại
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!existingProduct) {
      console.log(`Product with ID ${productId} not found`);
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }
    
    console.log(`Found existing product:`, {
      id: existingProduct.id,
      name: existingProduct.name,
      isFeatured: existingProduct.isFeatured
    });
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = {};
    
    // Cập nhật isFeatured nếu chỉ được cung cấp isFeatured (có thể là từ toggle switch)
    if (data.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(data.isFeatured);
      console.log(`Setting isFeatured to: ${updateData.isFeatured}`);
      
      // Nếu là cập nhật đầy đủ thông tin sản phẩm, xử lý các trường khác
      if (Object.keys(data).length > 1) {
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = parseFloat(data.price);
        if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
        if (data.categoryId) updateData.categoryId = data.categoryId;
        if (data.brand !== undefined) updateData.brand = data.brand || null;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      }
    } else {
      // Nếu không có isFeatured, đây là cập nhật thông tin sản phẩm thông thường
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = parseFloat(data.price);
      if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.brand !== undefined) updateData.brand = data.brand || null;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    }
    
    // Đảm bảo có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      console.log('No update data provided');
      return NextResponse.json(
        { error: "Không có dữ liệu cập nhật" },
        { status: 400 }
      );
    }
    
    console.log(`Final update data:`, updateData);
    
    try {
      // Cập nhật sản phẩm
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
        },
      });
      
      console.log(`Product updated successfully:`, {
        id: updatedProduct.id,
        name: updatedProduct.name,
        isFeatured: updatedProduct.isFeatured
      });
      
      // Thêm thông tin trạng thái nổi bật cho phản hồi
      const response = {
        ...updatedProduct,
        featuredStatus: updatedProduct.isFeatured ? 'Sản phẩm nổi bật' : 'Sản phẩm thường'
      };
      
      return NextResponse.json(response);
    } catch (prismaError: any) {
      console.error("Prisma error during product update:", prismaError);
      return NextResponse.json(
        { 
          error: "Lỗi khi cập nhật sản phẩm trong cơ sở dữ liệu", 
          details: prismaError.message || "Unknown database error"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    return NextResponse.json(
      { 
        error: "Đã xảy ra lỗi khi cập nhật sản phẩm",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Xóa sản phẩm (Admin only)
async function deleteProduct(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    // Kiểm tra sản phẩm tồn tại
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        orderItems: true,
        cartItems: true,
        productViews: true,
      }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }
    
    // Kiểm tra xem sản phẩm có đang được tham chiếu trong các đơn hàng hay không
    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: "Không thể xóa sản phẩm này vì nó đã được đặt hàng. Bạn có thể ẩn hoặc cập nhật lại trạng thái sản phẩm thay vì xóa nó." 
        },
        { status: 400 }
      );
    }
    
    // Xóa tất cả CartItems liên quan
    if (existingProduct.cartItems.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { productId }
      });
    }
    
    // Xóa tất cả ProductViews liên quan
    if (existingProduct.productViews.length > 0) {
      await prisma.productView.deleteMany({
        where: { productId }
      });
    }
    
    // Xóa sản phẩm
    await prisma.product.delete({
      where: { id: productId },
    });
    
    return NextResponse.json(
      { message: "Đã xóa sản phẩm thành công" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa sản phẩm" },
      { status: 500 }
    );
  }
}

// Export handlers with admin permission check
export const GET = withPermission(getProductById, "ADMIN");
export const PUT = withPermission(updateProduct, "ADMIN");
export const PATCH = withPermission(updateProduct, "ADMIN");
export const DELETE = withPermission(deleteProduct, "ADMIN"); 