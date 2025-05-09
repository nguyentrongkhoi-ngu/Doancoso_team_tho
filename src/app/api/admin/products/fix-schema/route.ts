import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { checkAdminPermission } from "@/lib/api-helpers";

// Hàm helper để thêm CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handler cho OPTIONS request (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

/**
 * API endpoint kiểm tra và sửa chữa schema bảng Product
 */
export async function GET(req: NextRequest) {
  console.log("Fix Schema API: Received request", req.url);
  
  // Kiểm tra quyền admin
  const permissionCheck = await checkAdminPermission();
  
  if (!permissionCheck.success) {
    return setCorsHeaders(NextResponse.json({
      success: false,
      message: permissionCheck.message,
      details: permissionCheck.details
    }, { status: permissionCheck.status }));
  }
  
  try {
    // Kiểm tra xem cột isFeatured có tồn tại hay không
    const checkColumnQuery = `
      IF NOT EXISTS (
        SELECT * 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_NAME = 'Product' AND 
          COLUMN_NAME = 'isFeatured'
      )
      BEGIN
        SELECT 0 AS ColumnExists;
      END
      ELSE
      BEGIN
        SELECT 1 AS ColumnExists;
      END
    `;
    
    const checkResult = await prisma.$queryRawUnsafe(checkColumnQuery);
    const columnExists = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].ColumnExists : 0;
    
    console.log(`Fix Schema API: Column isFeatured exists: ${columnExists}`);
    
    // Thêm cột isFeatured nếu nó không tồn tại
    if (!columnExists) {
      console.log(`Fix Schema API: Adding isFeatured column to Product table`);
      
      const addColumnQuery = `
        ALTER TABLE [dbo].[Product]
        ADD [isFeatured] BIT NOT NULL CONSTRAINT [Product_isFeatured_df] DEFAULT 0;
      `;
      
      await prisma.$executeRawUnsafe(addColumnQuery);
      console.log(`Fix Schema API: Added isFeatured column to Product table`);
      
      return setCorsHeaders(NextResponse.json({
        success: true,
        message: "Đã thêm cột isFeatured vào bảng Product",
        action: "added_column"
      }));
    } else {
      return setCorsHeaders(NextResponse.json({
        success: true,
        message: "Cột isFeatured đã tồn tại trong bảng Product",
        action: "none"
      }));
    }
  } catch (error: any) {
    console.error("Fix Schema API: Unexpected error:", error);
    
    return setCorsHeaders(NextResponse.json({
      success: false,
      message: "Đã xảy ra lỗi khi kiểm tra/sửa chữa schema",
      details: error.message
    }, { status: 500 }));
  }
} 