import { NextRequest, NextResponse } from "next/server";
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
 * API endpoint kiểm tra kết nối và quyền admin
 */
export async function GET(req: NextRequest) {
  console.log("Check API: Received request", req.url);
  
  // Kiểm tra quyền admin
  const permissionCheck = await checkAdminPermission();
  
  if (!permissionCheck.success) {
    return setCorsHeaders(NextResponse.json({
      success: false,
      message: permissionCheck.message,
      details: permissionCheck.details
    }, { status: permissionCheck.status }));
  }
  
  // Nếu có quyền admin, trả về thông tin thành công
  return setCorsHeaders(NextResponse.json({
    success: true,
    message: "API kết nối thành công",
    user: {
      email: permissionCheck.userEmail,
      role: permissionCheck.userRole
    },
    timestamp: new Date().toISOString()
  }));
} 