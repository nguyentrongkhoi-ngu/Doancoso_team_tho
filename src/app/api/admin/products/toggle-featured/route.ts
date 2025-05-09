import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { 
  checkAdminPermission, 
  checkDatabaseConnection, 
  checkProductExists,
  createApiResponse,
  createApiErrorResponse
} from "@/lib/api-helpers";

// Debug log cho môi trường
console.log("Toggle Featured API Module loaded, NODE_ENV:", process.env.NODE_ENV);

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

// Endpoint để toggle trạng thái nổi bật của sản phẩm
export async function POST(req: NextRequest) {
  console.log("Toggle Featured API: Received request", req.url);
  
  try {
    // Kiểm tra kết nối database
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      console.error(`Toggle Featured API: Database connection failed: ${dbStatus.details}`);
      return setCorsHeaders(createApiErrorResponse({
        message: dbStatus.message,
        details: dbStatus.details
      }, 503)); // Service Unavailable
    }
    
    // Kiểm tra quyền admin
    const permissionCheck = await checkAdminPermission();
    if (!permissionCheck.success) {
      console.error(`Toggle Featured API: Permission check failed: ${permissionCheck.message}`);
      return setCorsHeaders(createApiErrorResponse({
        message: permissionCheck.message,
        details: permissionCheck.details
      }, permissionCheck.status));
    }
    
    console.log(`Toggle Featured API: User ${permissionCheck.userEmail} (${permissionCheck.userRole}) is authorized`);

    // Parse the request body
    let data;
    try {
      data = await req.json();
      console.log(`Toggle Featured API: Data received:`, JSON.stringify(data));
    } catch (parseError) {
      console.error("Toggle Featured API: Failed to parse request JSON:", parseError);
      return setCorsHeaders(createApiErrorResponse({
        message: "Dữ liệu không hợp lệ",
        details: "Could not parse JSON body"
      }, 400));
    }

    // Validate required fields
    if (!data || !data.productId) {
      console.error("Toggle Featured API: Missing product ID");
      return setCorsHeaders(createApiErrorResponse({
        message: "Thiếu ID sản phẩm",
        details: "productId is required"
      }, 400));
    }

    const productId = data.productId;
    const newStatus = data.isFeatured === undefined ? true : Boolean(data.isFeatured);
    
    console.log(`Toggle Featured API: Processing request for product ${productId} to set isFeatured=${newStatus}`);

    // Kiểm tra xem sản phẩm có tồn tại không
    const productCheck = await checkProductExists(productId);
    if (!productCheck.exists) {
      console.error(`Toggle Featured API: Product check failed: ${productCheck.message}`);
      return setCorsHeaders(createApiErrorResponse({
        message: productCheck.message,
        details: productCheck.details
      }, 404));
    }

    if (productCheck.error) {
      console.error(`Toggle Featured API: Product check error: ${productCheck.message}`);
      return setCorsHeaders(createApiErrorResponse({
        message: productCheck.message,
        details: productCheck.details
      }, 500));
    }

    console.log(`Toggle Featured API: Found product: ${JSON.stringify(productCheck.product)}`);

    // Update product in database
    try {
      console.log(`Toggle Featured API: Updating product ${productId} isFeatured to ${newStatus}`);
      
      // Sử dụng raw SQL để kiểm tra và thêm cột isFeatured nếu nó không tồn tại
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
        
        console.log(`Toggle Featured API: Column isFeatured exists: ${columnExists}`);
        
        // Thêm cột isFeatured nếu nó không tồn tại
        if (!columnExists) {
          console.log(`Toggle Featured API: Adding isFeatured column to Product table`);
          
          const addColumnQuery = `
            ALTER TABLE [dbo].[Product]
            ADD [isFeatured] BIT NOT NULL CONSTRAINT [Product_isFeatured_df] DEFAULT 0;
          `;
          
          await prisma.$executeRawUnsafe(addColumnQuery);
          console.log(`Toggle Featured API: Added isFeatured column to Product table`);
        }
      } catch (sqlError) {
        console.error(`Toggle Featured API: Error checking/adding column:`, sqlError);
        // Tiếp tục với cách cập nhật thông thường ngay cả khi có lỗi
      }
      
      // Sử dụng transaction để đảm bảo tính nhất quán của thao tác
      const updatedProduct = await prisma.$transaction(async (tx) => {
        try {
          // Cập nhật sản phẩm - Phương pháp 1: Sử dụng API Prisma thông thường
          const result = await tx.product.update({
            where: { id: productId },
            data: { 
              isFeatured: newStatus 
            },
            select: {
              id: true,
              name: true
            }
          });
          
          return {
            ...result,
            isFeatured: newStatus // Thêm trường isFeatured vào kết quả
          };
        } catch (prismaError) {
          console.error(`Toggle Featured API: Prisma update failed, trying raw SQL:`, prismaError);
          
          // Phương pháp 2: Sử dụng raw SQL nếu cách 1 thất bại
          try {
            const updateQuery = `
              UPDATE [dbo].[Product]
              SET [isFeatured] = ${newStatus ? 1 : 0}
              WHERE [id] = '${productId}';
              
              SELECT [id], [name] FROM [dbo].[Product] WHERE [id] = '${productId}';
            `;
            
            const rawResult = await tx.$queryRawUnsafe(updateQuery);
            console.log(`Toggle Featured API: Raw SQL update result:`, rawResult);
            
            // Giả định rằng kết quả trả về là một mảng chứa sản phẩm đã cập nhật
            if (Array.isArray(rawResult) && rawResult.length > 0) {
              return {
                ...rawResult[0],
                isFeatured: newStatus
              };
            }
            
            throw new Error("Raw SQL update failed to return product");
          } catch (rawError) {
            console.error(`Toggle Featured API: Raw SQL update failed:`, rawError);
            throw rawError;
          }
        }
      });

      console.log(`Toggle Featured API: Product updated successfully:`, JSON.stringify(updatedProduct));
      
      // Return success response
      return setCorsHeaders(createApiResponse({
        success: true,
        message: `Sản phẩm ${updatedProduct.name} ${updatedProduct.isFeatured ? 'đã được' : 'không còn'} đặt làm nổi bật`,
        product: updatedProduct
      }));
    } catch (dbError: any) {
      console.error("Toggle Featured API: Database error during product update:", dbError);
      
      // Xử lý các lỗi Prisma cụ thể
      if (dbError instanceof PrismaClientKnownRequestError) {
        console.error(`Toggle Featured API: Prisma error code: ${dbError.code}, meta: ${JSON.stringify(dbError.meta)}`);
        
        if (dbError.code === 'P2025') {
          return setCorsHeaders(createApiErrorResponse({
            message: "Sản phẩm không tồn tại",
            details: "Record to update not found",
            code: dbError.code
          }, 404));
        }
      }
      
      return setCorsHeaders(createApiErrorResponse({
        message: "Lỗi khi cập nhật trạng thái sản phẩm", 
        details: dbError.message,
        code: dbError instanceof PrismaClientKnownRequestError ? dbError.code : undefined
      }, 500));
    }
  } catch (error: any) {
    console.error("Toggle Featured API: Unexpected error:", error);
    return setCorsHeaders(createApiErrorResponse({
      message: "Đã xảy ra lỗi khi cập nhật trạng thái nổi bật",
      details: error.message
    }, 500));
  }
} 