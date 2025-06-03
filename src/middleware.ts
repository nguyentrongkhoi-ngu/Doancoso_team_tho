import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { initRecommendationEngine } from "./lib/recommendation-engine/init";

// Các đường dẫn được bảo vệ cần đăng nhập
const protectedPaths = ['/profile', '/checkout', '/admin'];

// Các đường dẫn chỉ dành cho admin
const adminPaths = ['/admin'];

// Các đường dẫn công khai, không cần kiểm tra quyền
const publicPaths = ['/', '/login', '/register', '/products', '/api'];

// Array of API routes that need detailed logging
const API_ROUTES_TO_LOG = [
  '/api/admin/products',
  '/api/admin/products/toggle-featured'
];

// Khởi tạo hệ thống gợi ý sản phẩm
// Đảm bảo chỉ chạy trên server, không phải client
if (typeof window === 'undefined') {
  try {
    console.log('Đang khởi tạo hệ thống gợi ý sản phẩm...');
    // Sử dụng setTimeout để đảm bảo không chặn quá trình khởi tạo ứng dụng
    setTimeout(() => {
      initRecommendationEngine()
        .then(() => console.log('Đã khởi tạo hệ thống gợi ý sản phẩm thành công'))
        .catch((error) => console.error('Lỗi khi khởi tạo hệ thống gợi ý sản phẩm:', error));
    }, 5000); // Khởi tạo sau 5 giây để đảm bảo ứng dụng đã khởi động hoàn toàn
  } catch (error) {
    console.error('Lỗi khi chuẩn bị khởi tạo hệ thống gợi ý sản phẩm:', error);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Đảm bảo UTF-8 encoding cho tất cả API requests
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Accept-Charset', 'utf-8');

    // Nếu là API route, không cần kiểm tra auth cho một số endpoints
    if (pathname.startsWith('/api/products') && request.method === 'GET') {
      return response;
    }
  }

  // Cho phép các public paths mà không cần xử lý thêm
  if (publicPaths.some(path => pathname.startsWith(path)) && !protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Only log API routes in development environment
  const shouldLogDetailed = process.env.NODE_ENV === 'development' &&
    API_ROUTES_TO_LOG.some(route => pathname.startsWith(route));

  if (shouldLogDetailed) {
    console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}`);

    // Log các headers quan trọng
    try {
      const headers = Object.fromEntries(request.headers);
      console.log('Headers:', JSON.stringify({
        'content-type': headers['content-type'],
        'accept': headers['accept'],
        'user-agent': headers['user-agent']?.substring(0, 100),
        'authorization': headers['authorization'] ? '[redacted]' : undefined
      }));

      // Log request body nếu là POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          // Clone request để không ảnh hưởng đến việc xử lý sau này
          const clonedRequest = request.clone();
          const contentType = request.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            const body = await clonedRequest.json();
            console.log('Request body:', JSON.stringify(body));
          }
        } catch (error) {
          console.log('Unable to parse request body');
        }
      }

      // Log các query params
      if (request.nextUrl.search) {
        console.log('Query params:', request.nextUrl.search);
      }
    } catch (error) {
      console.error('Error logging request details:', error);
    }
  }

  try {
    // Lấy session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Nếu không có token và đường dẫn cần bảo vệ, chuyển hướng đến trang đăng nhập
    if (!token && protectedPaths.some(path => pathname.startsWith(path))) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }

    // Kiểm tra quyền admin
    if (adminPaths.some(path => pathname.startsWith(path)) && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Truyền thông tin người dùng qua headers
    const response = NextResponse.next();
    if (token) {
      response.headers.set('x-user-id', token.sub || '');
      response.headers.set('x-user-role', token.role || 'USER');
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Trong trường hợp lỗi, cho phép tiếp tục nhưng ghi log lỗi
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};