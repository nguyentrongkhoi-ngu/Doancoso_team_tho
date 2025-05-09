import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Kiểm tra phân quyền truy cập
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Không có quyền truy cập' }),
        { status: 403 }
      );
    }

    // Lấy tham số thời gian từ URL
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';
    
    // Tính thời gian bắt đầu dựa vào tham số
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Mặc định là 7 ngày
    }

    // Lấy tổng số người dùng
    const totalUsers = await prisma.user.count();
    
    // Lấy số người dùng đã hoạt động trong khoảng thời gian
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { productViews: { some: { updatedAt: { gte: startDate } } } },
          { searchQueries: { some: { createdAt: { gte: startDate } } } },
          { orders: { some: { createdAt: { gte: startDate } } } },
        ],
      },
    });

    // Lấy thống kê về danh mục được xem nhiều nhất
    const categoryViews = await prisma.$queryRaw`
      SELECT c.name, COUNT(*) as count
      FROM ProductView pv
      JOIN Product p ON pv.productId = p.id
      JOIN Category c ON p.categoryId = c.id
      WHERE pv.updatedAt >= ${startDate}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 7
    `;

    // Lấy các từ khóa tìm kiếm phổ biến
    const searchTerms = await prisma.$queryRaw`
      SELECT query as term, COUNT(*) as count
      FROM SearchQuery
      WHERE createdAt >= ${startDate}
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `;

    // Lấy thống kê lượt xem theo thời gian trong ngày
    const viewsByTimeOfDay = [
      { timeOfDay: 'Morning (5-11)', count: 0 },
      { timeOfDay: 'Afternoon (12-17)', count: 0 },
      { timeOfDay: 'Evening (18-22)', count: 0 },
      { timeOfDay: 'Night (23-4)', count: 0 },
    ];
    
    const timeStats = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 5 AND 11 THEN 'Morning (5-11)'
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 12 AND 17 THEN 'Afternoon (12-17)'
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 18 AND 22 THEN 'Evening (18-22)'
          ELSE 'Night (23-4)'
        END as timeOfDay,
        COUNT(*) as count
      FROM ProductView
      WHERE updatedAt >= ${startDate}
      GROUP BY CASE 
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 5 AND 11 THEN 'Morning (5-11)'
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 12 AND 17 THEN 'Afternoon (12-17)'
          WHEN DATEPART(HOUR, updatedAt) BETWEEN 18 AND 22 THEN 'Evening (18-22)'
          ELSE 'Night (23-4)'
        END
    `;
    
    // Cập nhật viewsByTimeOfDay với kết quả thực tế
    for (const stat of timeStats as any[]) {
      const index = viewsByTimeOfDay.findIndex(v => v.timeOfDay === stat.timeOfDay);
      if (index !== -1) {
        viewsByTimeOfDay[index].count = Number(stat.count);
      }
    }

    // Lấy thống kê lượt xem theo ngày trong tuần
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const viewsByDay = daysOfWeek.map(day => ({ day, count: 0 }));
    
    const dayStats = await prisma.$queryRaw`
      SELECT 
        CASE DATEPART(WEEKDAY, updatedAt)
          WHEN 1 THEN 'Sunday'
          WHEN 2 THEN 'Monday'
          WHEN 3 THEN 'Tuesday'
          WHEN 4 THEN 'Wednesday'
          WHEN 5 THEN 'Thursday'
          WHEN 6 THEN 'Friday'
          WHEN 7 THEN 'Saturday'
        END as day,
        COUNT(*) as count
      FROM ProductView
      WHERE updatedAt >= ${startDate}
      GROUP BY DATEPART(WEEKDAY, updatedAt)
    `;
    
    // Cập nhật viewsByDay với kết quả thực tế
    for (const stat of dayStats as any[]) {
      const index = viewsByDay.findIndex(v => v.day === stat.day);
      if (index !== -1) {
        viewsByDay[index].count = Number(stat.count);
      }
    }

    // Tính tỷ lệ chuyển đổi (đơn hàng / người dùng hoạt động)
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
    });
    
    const conversionRate = activeUsers > 0 ? totalOrders / activeUsers : 0;

    // Tính thời gian xem trung bình
    const viewDurationResult = await prisma.$queryRaw`
      SELECT AVG(CAST(duration as float)) as averageDuration
      FROM ProductView
      WHERE updatedAt >= ${startDate} AND duration IS NOT NULL
    `;
    
    const averageViewDuration = viewDurationResult[0]
      ? Math.round(Number(viewDurationResult[0].averageDuration) || 0)
      : 0;

    // Trả về kết quả
    return NextResponse.json({
      totalUsers,
      activeUsers,
      topCategories: categoryViews,
      searchTerms,
      viewsByTime: viewsByTimeOfDay,
      viewsByDay,
      conversionRate,
      averageViewDuration,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê hành vi người dùng:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Lỗi khi lấy thống kê hành vi người dùng',
        details: (error as Error).message
      }),
      { status: 500 }
    );
  }
} 