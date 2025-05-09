import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Hàm kiểm tra URL hình ảnh hợp lệ
const isValidImageUrl = (url: string) => {
  // Kiểm tra định dạng URL cơ bản
  try {
    new URL(url);
  } catch (e) {
    return false;
  }
  
  // Kiểm tra đuôi file là hình ảnh thông dụng
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasValidExtension = validExtensions.some(ext => 
    url.toLowerCase().endsWith(ext) || url.toLowerCase().includes(ext + '?')
  );
  
  return hasValidExtension;
};

// GET /api/products/[id]/images - Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch images for this product
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/images - Add a new image to a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;
    const { imageUrl, order } = await request.json();

    // Validate input
    if (!imageUrl || imageUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Kiểm tra tính hợp lệ của URL hình ảnh
    if (!isValidImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL format. URL must end with a valid image extension (.jpg, .png, etc.)' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get the highest order value to append at the end if order not specified
    let finalOrder = order;
    if (finalOrder === undefined) {
      const highestOrderImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { order: 'desc' },
      });
      
      finalOrder = highestOrderImage ? highestOrderImage.order + 1 : 0;
    }

    // Create new image
    const newImage = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        order: finalOrder,
      },
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Error adding product image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/images?imageId=123 - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Check if image exists and belongs to the product
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or does not belong to this product' },
        { status: 404 }
      );
    }

    // Delete the image
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 