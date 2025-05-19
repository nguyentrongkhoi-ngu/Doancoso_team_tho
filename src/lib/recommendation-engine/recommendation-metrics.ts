import prisma from "@/lib/prisma";

/**
 * Đánh dấu loại gợi ý khi người dùng tương tác với sản phẩm
 */
export type RecommendationInteraction = {
  userId: string;
  productId: string;
  recommendationType: string;
  interactionType: 'view' | 'cart' | 'purchase';
  timestamp: Date;
};

/**
 * Kết quả đánh giá hiệu quả gợi ý
 */
export type RecommendationMetrics = {
  totalImpressions: number;
  totalClicks: number;
  totalPurchases: number;
  clickThroughRate: number;
  conversionRate: number;
  typeMetrics: Record<string, {
    impressions: number;
    clicks: number;
    purchases: number;
    ctr: number;
    cr: number;
  }>;
};

/**
 * Ghi lại tương tác với sản phẩm được gợi ý
 */
export async function logRecommendationInteraction(
  userId: string,
  productId: string,
  recommendationType: string,
  interactionType: 'view' | 'cart' | 'purchase'
): Promise<boolean> {
  try {
    await prisma.recommendationInteraction.create({
      data: {
        userId,
        productId,
        recommendationType,
        interactionType,
        timestamp: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi lại tương tác gợi ý:', error);
    return false;
  }
}

/**
 * Tính toán các chỉ số hiệu quả của hệ thống gợi ý
 */
export async function calculateRecommendationMetrics(
  startDate: Date,
  endDate: Date
): Promise<RecommendationMetrics> {
  try {
    // Truy vấn tất cả tương tác trong khoảng thời gian
    const interactions = await prisma.recommendationInteraction.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Nếu không có dữ liệu, trả về metrics mặc định
    if (interactions.length === 0) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalPurchases: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        typeMetrics: {}
      };
    }
    
    // Phân loại tương tác theo loại
    const viewInteractions = interactions.filter(i => i.interactionType === 'view');
    const cartInteractions = interactions.filter(i => i.interactionType === 'cart');
    const purchaseInteractions = interactions.filter(i => i.interactionType === 'purchase');
    
    const totalImpressions = viewInteractions.length;
    const totalClicks = cartInteractions.length;
    const totalPurchases = purchaseInteractions.length;
    
    // Tính tỷ lệ
    const clickThroughRate = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const conversionRate = totalClicks > 0 ? totalPurchases / totalClicks : 0;
    
    // Phân tích theo loại gợi ý
    const typeMap = new Map<string, {
      impressions: number;
      clicks: number;
      purchases: number;
    }>();
    
    // Khởi tạo dữ liệu cho mỗi loại gợi ý
    const uniqueTypes = [...new Set(interactions.map(i => i.recommendationType))];
    uniqueTypes.forEach(type => {
      typeMap.set(type, { impressions: 0, clicks: 0, purchases: 0 });
    });
    
    // Thống kê dữ liệu
    viewInteractions.forEach(i => {
      const data = typeMap.get(i.recommendationType)!;
      data.impressions += 1;
    });
    
    cartInteractions.forEach(i => {
      const data = typeMap.get(i.recommendationType)!;
      data.clicks += 1;
    });
    
    purchaseInteractions.forEach(i => {
      const data = typeMap.get(i.recommendationType)!;
      data.purchases += 1;
    });
    
    // Tạo metrics theo loại
    const typeMetrics: Record<string, any> = {};
    typeMap.forEach((data, type) => {
      const ctr = data.impressions > 0 ? data.clicks / data.impressions : 0;
      const cr = data.clicks > 0 ? data.purchases / data.clicks : 0;
      
      typeMetrics[type] = {
        ...data,
        ctr,
        cr
      };
    });
    
    return {
      totalImpressions,
      totalClicks,
      totalPurchases,
      clickThroughRate,
      conversionRate,
      typeMetrics
    };
  } catch (error) {
    console.error('Lỗi khi tính toán chỉ số hiệu quả gợi ý:', error);
    throw error;
  }
}

/**
 * Phân tích hiệu quả A/B testing của các loại gợi ý
 */
export async function analyzeABTestResults(
  startDate: Date,
  endDate: Date
): Promise<{
  winner: string;
  improvement: number;
  metrics: RecommendationMetrics;
}> {
  try {
    const metrics = await calculateRecommendationMetrics(startDate, endDate);
    const typeMetrics = metrics.typeMetrics;
    
    // Tìm loại gợi ý có kết quả tốt nhất dựa trên tỷ lệ chuyển đổi
    let bestType = '';
    let bestCR = 0;
    let secondBestCR = 0;
    
    Object.entries(typeMetrics).forEach(([type, data]) => {
      if (data.cr > bestCR) {
        secondBestCR = bestCR;
        bestCR = data.cr;
        bestType = type;
      } else if (data.cr > secondBestCR) {
        secondBestCR = data.cr;
      }
    });
    
    // Tính toán mức độ cải thiện
    const improvement = secondBestCR > 0 ? ((bestCR - secondBestCR) / secondBestCR) * 100 : 0;
    
    return {
      winner: bestType || 'không xác định',
      improvement,
      metrics
    };
  } catch (error) {
    console.error('Lỗi khi phân tích kết quả A/B testing:', error);
    throw error;
  }
}

/**
 * Tạo báo cáo hiệu quả của hệ thống gợi ý
 */
export async function generateRecommendationReport(
  period: 'day' | 'week' | 'month'
): Promise<string> {
  const now = new Date();
  let startDate: Date;
  
  // Xác định thời gian bắt đầu dựa trên period
  switch (period) {
    case 'day':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  
  try {
    const metrics = await calculateRecommendationMetrics(startDate, now);
    const abResults = await analyzeABTestResults(startDate, now);
    
    // Tạo nội dung báo cáo
    let report = `=== Báo cáo hiệu quả hệ thống gợi ý ===\n`;
    report += `Thời gian: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}\n\n`;
    
    report += `Tổng số lần hiển thị: ${metrics.totalImpressions}\n`;
    report += `Tổng số lần click: ${metrics.totalClicks}\n`;
    report += `Tổng số lần mua: ${metrics.totalPurchases}\n\n`;
    
    report += `Tỷ lệ click (CTR): ${(metrics.clickThroughRate * 100).toFixed(2)}%\n`;
    report += `Tỷ lệ chuyển đổi (CR): ${(metrics.conversionRate * 100).toFixed(2)}%\n\n`;
    
    report += `Loại gợi ý hiệu quả nhất: ${abResults.winner}\n`;
    report += `Mức độ cải thiện: ${abResults.improvement.toFixed(2)}%\n\n`;
    
    report += `=== Chi tiết theo loại gợi ý ===\n`;
    Object.entries(metrics.typeMetrics).forEach(([type, data]) => {
      report += `\n${type}:\n`;
      report += `  - Hiển thị: ${data.impressions}\n`;
      report += `  - Clicks: ${data.clicks}\n`;
      report += `  - Mua: ${data.purchases}\n`;
      report += `  - CTR: ${(data.ctr * 100).toFixed(2)}%\n`;
      report += `  - CR: ${(data.cr * 100).toFixed(2)}%\n`;
    });
    
    return report;
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo hiệu quả gợi ý:', error);
    return `Lỗi khi tạo báo cáo: ${(error as Error).message}`;
  }
}

/**
 * Tính toán hiệu suất của các thuật toán gợi ý
 * @param startDate Ngày bắt đầu
 * @param endDate Ngày kết thúc
 * @returns Hiệu suất của các thuật toán
 */
export async function calculateRecommendationPerformance(
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    // Lấy tất cả tương tác trong khoảng thời gian
    const interactions = await prisma.recommendationInteraction.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Tính toán hiệu suất cho từng thuật toán
    const algorithmStats = new Map<string, {
      viewCount: number;
      cartCount: number;
      purchaseCount: number;
    }>();

    // Khởi tạo Map với tất cả các thuật toán đã biết
    const knownAlgorithms = ['tensorflow', 'collaborative', 'content', 'matrix', 'popular', 'hybrid'];
    knownAlgorithms.forEach(algo => {
      algorithmStats.set(algo, { viewCount: 0, cartCount: 0, purchaseCount: 0 });
    });

    // Đếm số lượng tương tác cho từng thuật toán
    interactions.forEach(interaction => {
      const stats = algorithmStats.get(interaction.recommendationType) || 
                    { viewCount: 0, cartCount: 0, purchaseCount: 0 };
      
      switch (interaction.interactionType) {
        case 'view':
          stats.viewCount++;
          break;
        case 'cart':
          stats.cartCount++;
          break;
        case 'purchase':
          stats.purchaseCount++;
          break;
      }
      
      algorithmStats.set(interaction.recommendationType, stats);
    });

    // Tính toán tỷ lệ chuyển đổi và tạo các bản ghi hiệu suất
    const performanceRecords = [];
    
    for (const [algorithm, stats] of algorithmStats.entries()) {
      const totalImpressions = stats.viewCount;
      if (totalImpressions === 0) continue;
      
      const conversionRate = (stats.purchaseCount / totalImpressions) * 100;
      
      // Tạo hoặc cập nhật bản ghi hiệu suất
      const performance = await prisma.recommendationPerformance.upsert({
        where: {
          id: `${algorithm}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`
        },
        update: {
          viewCount: stats.viewCount,
          cartCount: stats.cartCount,
          purchaseCount: stats.purchaseCount,
          conversionRate,
          updatedAt: new Date()
        },
        create: {
          id: `${algorithm}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`,
          algorithmType: algorithm,
          viewCount: stats.viewCount,
          cartCount: stats.cartCount,
          purchaseCount: stats.purchaseCount,
          conversionRate,
          startDate,
          endDate
        }
      });
      
      performanceRecords.push(performance);
    }
    
    return performanceRecords;
  } catch (error) {
    console.error('Lỗi khi tính toán hiệu suất gợi ý:', error);
    return [];
  }
}

/**
 * Tạo công việc định kỳ tính toán hiệu suất gợi ý
 * Gọi hàm này khi khởi động ứng dụng
 */
export function schedulePerformanceCalculation(): void {
  // Tính toán hiệu suất mỗi ngày vào lúc 00:05
  const calculateDaily = () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Đặt thời gian lúc 00:00:00 cho yesterday và 23:59:59 cho now
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(now);
    endOfYesterday.setHours(0, 0, 0, 0);
    endOfYesterday.setMilliseconds(-1);
    
    calculateRecommendationPerformance(yesterday, endOfYesterday)
      .then(records => {
        console.log(`Đã tính toán hiệu suất gợi ý cho ngày ${yesterday.toISOString().split('T')[0]}`);
      })
      .catch(error => {
        console.error('Lỗi khi tính toán hiệu suất gợi ý:', error);
      });
  };
  
  // Tính toán hiệu suất mỗi tuần vào lúc 01:00 của ngày đầu tuần
  const calculateWeekly = () => {
    const now = new Date();
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - now.getDay()); // Đặt về ngày đầu tuần hiện tại
    lastWeekEnd.setHours(0, 0, 0, 0);
    lastWeekEnd.setMilliseconds(-1); // Cuối ngày của chủ nhật tuần trước
    
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Đặt về ngày đầu tuần trước
    lastWeekStart.setHours(0, 0, 0, 0);
    
    calculateRecommendationPerformance(lastWeekStart, lastWeekEnd)
      .then(records => {
        console.log(`Đã tính toán hiệu suất gợi ý cho tuần ${lastWeekStart.toISOString().split('T')[0]} đến ${lastWeekEnd.toISOString().split('T')[0]}`);
      })
      .catch(error => {
        console.error('Lỗi khi tính toán hiệu suất gợi ý hàng tuần:', error);
      });
  };
  
  // Tính toán hiệu suất mỗi tháng vào lúc 02:00 của ngày đầu tháng
  const calculateMonthly = () => {
    const now = new Date();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    
    calculateRecommendationPerformance(lastMonthStart, lastMonthEnd)
      .then(records => {
        console.log(`Đã tính toán hiệu suất gợi ý cho tháng ${lastMonthStart.toISOString().split('T')[0]} đến ${lastMonthEnd.toISOString().split('T')[0]}`);
      })
      .catch(error => {
        console.error('Lỗi khi tính toán hiệu suất gợi ý hàng tháng:', error);
      });
  };
  
  // Lịch công việc
  setInterval(calculateDaily, 24 * 60 * 60 * 1000); // Mỗi ngày
  
  // Kiểm tra xem có phải ngày đầu tuần không (thứ 2)
  const scheduleWeekly = () => {
    const now = new Date();
    if (now.getDay() === 1) { // 1 là thứ 2
      calculateWeekly();
    }
  };
  
  // Kiểm tra xem có phải ngày đầu tháng không
  const scheduleMonthly = () => {
    const now = new Date();
    if (now.getDate() === 1) { // Ngày đầu tháng
      calculateMonthly();
    }
  };
  
  setInterval(scheduleWeekly, 24 * 60 * 60 * 1000); // Kiểm tra mỗi ngày
  setInterval(scheduleMonthly, 24 * 60 * 60 * 1000); // Kiểm tra mỗi ngày
  
  // Chạy ngay lập tức cho lần đầu tiên
  calculateDaily();
  scheduleWeekly();
  scheduleMonthly();
}

/**
 * Lấy báo cáo về hiệu suất gợi ý
 * @param period Khoảng thời gian báo cáo: 'day', 'week', 'month'
 * @returns Báo cáo hiệu suất gợi ý
 */
export async function getRecommendationPerformanceReport(
  period: 'day' | 'week' | 'month' = 'week'
): Promise<any> {
  try {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    // Đặt giờ về 00:00:00 và 23:59:59
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Lấy dữ liệu hiệu suất
    const performanceData = await prisma.recommendationPerformance.findMany({
      where: {
        startDate: {
          gte: startDate
        },
        endDate: {
          lte: endDate
        }
      },
      orderBy: {
        conversionRate: 'desc'
      }
    });
    
    return {
      period,
      startDate,
      endDate,
      algorithms: performanceData,
      bestPerforming: performanceData.length > 0 ? performanceData[0] : null,
      totalImpressions: performanceData.reduce((sum, record) => sum + record.viewCount, 0),
      totalConversions: performanceData.reduce((sum, record) => sum + record.purchaseCount, 0),
      averageConversionRate: performanceData.length > 0
        ? performanceData.reduce((sum, record) => sum + record.conversionRate, 0) / performanceData.length
        : 0
    };
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo hiệu suất gợi ý:', error);
    return {
      period,
      algorithms: [],
      error: 'Không thể lấy dữ liệu hiệu suất'
    };
  }
} 