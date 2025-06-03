/**
 * API Helpers - Các hàm hỗ trợ cho API
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logger } from "./logger";
import { createErrorResponse } from "./error-handler";
import { prisma } from "@/db";

/**
 * Kiểm tra xem người dùng có quyền admin không
 */
export async function checkAdminPermission() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        status: 401,
        message: "Bạn cần đăng nhập để thực hiện thao tác này",
        details: "No session found"
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        status: 403,
        message: "Bạn không có quyền thực hiện thao tác này",
        details: `Role required: ADMIN, current: ${session.user.role}`
      };
    }

    return {
      success: true,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role
    };
  } catch (error: any) {
    console.error("Error checking admin permission:", error);
    return {
      success: false,
      status: 500,
      message: "Lỗi khi kiểm tra quyền truy cập",
      details: error.message
    };
  }
}

/**
 * Kiểm tra xem sản phẩm có tồn tại không
 */
export async function checkProductExists(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true
      }
    });

    if (!product) {
      return {
        exists: false,
        message: "Sản phẩm không tồn tại",
        details: `Product with ID ${productId} not found`
      };
    }

    return {
      exists: true,
      product
    };
  } catch (error: any) {
    console.error("Error checking product existence:", error);
    return {
      exists: false,
      error: true,
      message: "Lỗi khi kiểm tra sản phẩm",
      details: error.message
    };
  }
}

/**
 * Kiểm tra kết nối database
 */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as result`;
    return { connected: true };
  } catch (error: any) {
    console.error("Database connection error:", error);
    return {
      connected: false,
      message: "Không thể kết nối đến cơ sở dữ liệu",
      details: error.message
    };
  }
}

/**
 * API Response Builder
 */
export function createApiResponse(data: any, status = 200) {
  console.log(`API Response: Status ${status}`, data ? JSON.stringify(data).substring(0, 200) + '...' : 'null');
  return NextResponse.json(data, { status });
}

/**
 * API Error Response Builder
 * @deprecated Use createErrorResponse from error-handler.ts instead
 */
export function createApiErrorResponse(error: any, status = 500) {
  return createErrorResponse(error, status, process.env.NODE_ENV === 'development');
}