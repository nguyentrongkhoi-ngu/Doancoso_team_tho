import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateRecommendationMetrics, generateRecommendationReport } from "@/lib/recommendation-engine/recommendation-metrics";

export async function GET(req: NextRequest) {
  try {
    // Kiểm tra quyền truy cập
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập API này" },
        { status: 403 }
      );
    }
    
    // Lấy tham số từ URL
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") || "week") as "day" | "week" | "month";
    const format = url.searchParams.get("format") || "json";
    
    // Xác định thời gian bắt đầu và kết thúc
    const endDate = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
        
      case "month":
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
        
      case "week":
      default:
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
    }
    
    // Lấy dữ liệu metrics
    if (format === "report") {
      // Trả về dạng báo cáo văn bản
      const report = await generateRecommendationReport(period);
      
      return new NextResponse(report, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    } else {
      // Trả về dạng JSON
      const metrics = await calculateRecommendationMetrics(startDate, endDate);
      
      return NextResponse.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy metrics gợi ý:", error);
    
    return NextResponse.json(
      { 
        error: "Đã xảy ra lỗi khi lấy metrics gợi ý",
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 