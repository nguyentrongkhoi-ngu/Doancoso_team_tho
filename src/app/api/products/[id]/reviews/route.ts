import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/products/[id]/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Extract pagination parameters with defaults
    const limit = Number(searchParams.get('limit') || '10');
    const page = Number(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

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

    // Get total count for pagination
    const totalCount = await prisma.review.count({
      where: { productId }
    });

    // Fetch reviews for this product with pagination
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      skip,
      take: limit,
    });

    // Return reviews with pagination metadata
    return NextResponse.json({
      reviews,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page,
        limit
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    const productId = params.id;

    // Đảm bảo encoding UTF-8 đúng cách
    const { rating, comment } = await request.json();

    // Normalize Unicode và làm sạch comment
    let normalizedComment = '';
    if (comment) {
      // Đầu tiên normalize
      normalizedComment = comment.normalize('NFC');

      // Kiểm tra và sửa các ký tự bị lỗi encoding
      if (/[�?]/.test(normalizedComment)) {
        console.warn('Detected encoding issues in comment:', normalizedComment);
        // Thay thế các pattern phổ biến
        normalizedComment = normalizedComment
          .replace(/T\?t/g, 'Tốt')
          .replace(/Tuy\?t/g, 'Tuyệt')
          .replace(/r\?t/g, 'rất')
          .replace(/h\?i/g, 'hài')
          .replace(/l\?ng/g, 'lòng')
          .replace(/ch\?t/g, 'chất')
          .replace(/l\?ng/g, 'lượng')
          .replace(/d\?ch/g, 'dịch')
          .replace(/v\?/g, 'vụ')
          .replace(/\?c/g, 'ặc')
          .replace(/bi\?t/g, 'biệt')
          .replace(/m\?n/g, 'màn')
          .replace(/h\?nh/g, 'hình')
          .replace(/s\?c/g, 'sắc')
          .replace(/n\?t/g, 'nét')
          .replace(/\?m/g, 'âm')
          .replace(/gi\?i/g, 'giới')
          .replace(/thi\?u/g, 'thiệu')
          .replace(/b\?n/g, 'bạn')
          .replace(/b\?/g, 'bè');

        console.log('Fixed comment:', normalizedComment);
      }
    }

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!normalizedComment || normalizedComment.trim() === '') {
      return NextResponse.json(
        { error: 'Comment is required' },
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

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: normalizedComment,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(updatedReview, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    } else {
      // Create new review
      const newReview = await prisma.review.create({
        data: {
          userId,
          productId,
          rating,
          comment: normalizedComment,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(newReview, {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 