import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export type Permission = "USER" | "ADMIN";

/**
 * Checks if the current user has the required permission
 */
export async function checkPermission(
  req: NextRequest,
  requiredPermission: Permission = "USER" 
): Promise<{ 
  authorized: boolean;
  response?: NextResponse;
}> {
  console.log(`Checking permission: ${requiredPermission}`);
  
  const session = await getServerSession(authOptions);
  
  console.log(`Session user data:`, session?.user ? {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email
  } : 'No session found');

  // Check if user is authenticated
  if (!session?.user?.id) {
    console.log('Authentication failed: No valid session');
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    };
  }

  // For admin endpoints, verify the user is an admin
  if (requiredPermission === "ADMIN" && session.user.role !== "ADMIN") {
    console.log(`Permission denied: User role ${session.user.role} does not match required permission ${requiredPermission}`);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    };
  }

  // User is authorized
  console.log(`Permission check passed for ${session.user.email}`);
  return { authorized: true };
}

/**
 * Higher-order function to protect API routes with permission checks
 */
export function withPermission(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  requiredPermission: Permission = "USER"
) {
  return async function(req: NextRequest, context: any) {
    console.log(`API request received: ${req.method} ${req.nextUrl.pathname}`);
    
    try {
      const { authorized, response } = await checkPermission(req, requiredPermission);
      
      if (!authorized && response) {
        console.log(`Permission check failed for ${req.nextUrl.pathname}`);
        return response;
      }
      
      console.log(`Permission check passed, executing handler for ${req.nextUrl.pathname}`);
      try {
        return await handler(req, context);
      } catch (handlerError: any) {
        console.error(`Error in API handler for ${req.nextUrl.pathname}:`, handlerError);
        
        // Return a more detailed error message
        return NextResponse.json(
          { 
            error: "Server error during API request processing",
            details: handlerError.message || "Unknown error",
            path: req.nextUrl.pathname
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error(`Error in permission middleware for ${req.nextUrl.pathname}:`, error);
      return NextResponse.json(
        { 
          error: "Server error during permission check",
          details: error.message || "Unknown error",
          path: req.nextUrl.pathname
        },
        { status: 500 }
      );
    }
  };
} 