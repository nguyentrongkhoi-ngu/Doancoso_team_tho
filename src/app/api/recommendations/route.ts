import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSmartRecommendations } from "@/lib/recommendation-engine/tf-prediction";
import { getRecommendedProducts } from "@/lib/recommendation-engine/hybrid-recommender";

/**
 * API endpoint để lấy sản phẩm gợi ý cho người dùng
 */
export async function GET(req: Request) {
  try {
    console.log("Recommendation API called")
    // Kiểm tra kết nối cơ sở dữ liệu
    try {
      await prisma.$connect();
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: String(dbError),
          stack: dbError.stack,
          message: dbError.message
        },
        { status: 500 }
      );
    }
    
    // Lấy thông tin session
    try {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        console.log("No session found, returning public recommendations");
      } else {
        console.log(`Session found for user: ${session.user?.name}`);
      }
      
      const url = new URL(req.url);
      const type = url.searchParams.get('type') || 'hybrid';
      const limit = parseInt(url.searchParams.get('limit') || '10');
      
      // Xây dựng đối tượng dữ liệu ngữ cảnh
      const contextData: {
        categoryId?: string,
        priceRange?: { min: number, max: number },
        searchQuery?: string,
        currentPage?: string,
        excludeProductId?: string
      } = {};
      
      // Lấy các tham số tùy chọn từ URL query
      if (url.searchParams.has('categoryId')) {
        contextData.categoryId = url.searchParams.get('categoryId');
      }
      
      if (url.searchParams.has('minPrice') && url.searchParams.has('maxPrice')) {
        contextData.priceRange = {
          min: parseFloat(url.searchParams.get('minPrice') || '0'),
          max: parseFloat(url.searchParams.get('maxPrice') || '100000')
        };
      }
      
      if (url.searchParams.has('search')) {
        contextData.searchQuery = url.searchParams.get('search');
      }
      
      if (url.searchParams.has('page')) {
        contextData.currentPage = url.searchParams.get('page');
      }

      if (url.searchParams.has('excludeProductId')) {
        contextData.excludeProductId = url.searchParams.get('excludeProductId');
      }
      
      // Đơn giản hóa: luôn trả về popular products để tránh timeout
      let result;

      console.log("Fetching popular products");
      try {
        // Tăng limit nếu cần loại bỏ sản phẩm
        const fetchLimit = contextData.excludeProductId ? limit + 2 : limit;

        const whereClause: any = {
          stock: { gt: 0 }
        };

        // Loại bỏ sản phẩm hiện tại nếu có
        if (contextData.excludeProductId) {
          whereClause.id = { not: contextData.excludeProductId };
        }

        // Ưu tiên sản phẩm cùng category nếu có
        if (contextData.categoryId) {
          whereClause.categoryId = contextData.categoryId;
        }

        let popularProducts = await prisma.product.findMany({
          where: whereClause,
          orderBy: [
            { isFeatured: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          include: {
            category: true
          }
        });

        // Nếu không đủ sản phẩm cùng category, lấy thêm từ category khác
        if (popularProducts.length < limit && contextData.categoryId) {
          const remainingLimit = limit - popularProducts.length;
          const otherProducts = await prisma.product.findMany({
            where: {
              stock: { gt: 0 },
              categoryId: { not: contextData.categoryId },
              id: contextData.excludeProductId ? { not: contextData.excludeProductId } : undefined
            },
            orderBy: [
              { isFeatured: 'desc' },
              { createdAt: 'desc' }
            ],
            take: remainingLimit,
            include: {
              category: true
            }
          });

          popularProducts = [...popularProducts, ...otherProducts];
        }

        result = popularProducts;
        console.log(`Found ${result.length} popular products`);
      } catch (error) {
        console.error('Error fetching popular products:', error);
        throw error;
      }
      
      if (!result || result.length === 0) {
        console.log("No products found");
        return NextResponse.json([]);
      }

      console.log(`Returning ${result.length} products`);
      
      return NextResponse.json(result);
    } catch (recError) {
      console.error('Error in recommendation engine:', recError);
      console.error('Error stack:', recError.stack);
      return NextResponse.json(
        { 
          error: 'Recommendation engine error', 
          details: String(recError),
          stack: recError.stack,
          message: recError.message,
          code: recError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in recommendation API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: String(error),
        stack: error.stack,
        message: error.message
      },
      { status: 500 }
    );
  }
} 