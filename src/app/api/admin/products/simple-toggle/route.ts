import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("Simple toggle API called");
  
  try {
    // Get product ID from query params as a fallback
    const searchParams = req.nextUrl.searchParams;
    const queryProductId = searchParams.get('productId');
    
    // Try to parse body first
    let data;
    let productId;
    let newStatus;
    
    try {
      data = await req.json();
      console.log("Request body:", data);
      
      productId = data.productId || queryProductId;
      newStatus = data.isFeatured === undefined ? true : Boolean(data.isFeatured);
    } catch (err) {
      console.log("Error parsing JSON body, using query params instead:", err);
      productId = queryProductId;
      newStatus = searchParams.get('isFeatured') === 'true';
    }
    
    console.log(`Processing request for product ${productId} with new status ${newStatus}`);
    
    if (!productId) {
      console.log("No product ID provided");
      return NextResponse.json({ 
        error: "Missing product ID", 
        searchParams: Object.fromEntries(searchParams.entries())
      }, { status: 400 });
    }
    
    // Just return success for debugging
    const mockResponse = {
      success: true,
      received: {
        productId,
        newStatus
      },
      message: "Debug response - no actual database update performed"
    };
    
    console.log("Sending response:", mockResponse);
    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error("Error in simple-toggle endpoint:", error);
    return NextResponse.json({
      error: "Server error",
      message: error.message || "Unknown error"
    }, { status: 500 });
  }
} 