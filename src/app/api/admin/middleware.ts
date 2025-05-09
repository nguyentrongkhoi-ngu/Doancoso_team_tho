import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware để ghi log các yêu cầu API đến admin route
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Log tất cả API admin requests
  console.log(`[ADMIN API] ${new Date().toISOString()} - ${request.method} ${pathname}`);
  
  // Nếu là route toggle-featured, log chi tiết hơn
  if (pathname.includes('toggle-featured')) {
    console.log(`[TOGGLE FEATURED] Request to: ${pathname}`);
    console.log(`[TOGGLE FEATURED] Headers:`, Object.fromEntries(request.headers));
    
    // Validate session
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      if (!token) {
        console.log('[TOGGLE FEATURED] No token found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (token.role !== 'ADMIN') {
        console.log(`[TOGGLE FEATURED] Invalid role: ${token.role}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      console.log(`[TOGGLE FEATURED] Authorized user: ${token.email}`);
    } catch (err) {
      console.error('[TOGGLE FEATURED] Auth error:', err);
    }
  }
  
  return NextResponse.next();
}

// Configure matcher for admin API routes
export const config = {
  matcher: ['/api/admin/:path*'],
}; 