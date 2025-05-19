import prisma from "@/lib/prisma";
import { Product, ProductView, SearchQuery, Order, OrderItem, Category } from "@prisma/client";

/**
 * Mô hình người dùng bao gồm thông tin về hành vi và sở thích
 */
export type UserBehaviorModel = {
  userId: string;
  favoriteCategories: { id: string; score: number }[];
  pricePreference: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    priceSegment: 'budget' | 'midrange' | 'premium' | 'luxury'; // Phân khúc giá mới
  };
  recentSearches: string[];
  viewPatterns: {
    timeOfDay: Record<string, number>; // Thời điểm trong ngày hay xem sản phẩm
    dayOfWeek: Record<string, number>; // Ngày trong tuần hay xem sản phẩm
    avgViewDuration: number; // Thời gian xem trung bình mới
    frequency: 'low' | 'medium' | 'high'; // Tần suất xem mới
  };
  seasonalPreferences: {
    currentSeason: string;
    seasonalCategories: string[];
    historicalSeasonalInterests: Record<string, string[]>; // Sở thích theo mùa qua các năm mới
  };
  brandAffinities: { brandId: string; score: number }[]; // Thương hiệu ưa thích mới
  interactionRecency: { // Độ gần đây của tương tác mới
    lastView: Date;
    lastSearch: Date;
    lastPurchase: Date;
  };
  purchaseBehavior: { // Chi tiết về hành vi mua hàng mới
    frequency: 'rare' | 'occasional' | 'frequent';
    avgOrderValue: number;
    preferredPaymentMethod: string;
    cartAbandonRate: number;
  };
  lastActive: Date;
};

/**
 * Lấy dữ liệu chi tiết về hành vi của người dùng
 * @param userId - ID người dùng cần phân tích
 * @returns Dữ liệu chi tiết về hành vi người dùng
 */
export async function getUserBehaviorData(userId: string) {
  // Lấy lịch sử xem sản phẩm
  const productViews = await prisma.productView.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Lấy lịch sử tìm kiếm
  const searchQueries = await prisma.searchQuery.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30 // Tăng số lượng lấy lên để phân tích tốt hơn
  });

  // Lấy lịch sử mua hàng
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: 'COMPLETED'
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Thêm: Lấy giỏ hàng bị bỏ quên - Sử dụng thông tin đơn hàng đã bị hủy thay thế
  const abandonedCarts = await prisma.order.findMany({
    where: { 
      userId,
      status: 'ABANDONED'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Lấy thông tin danh sách yêu thích
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true
        }
      }
    }
  });

  return {
    productViews,
    searchQueries,
    orders,
    abandonedCarts,
    wishlistItems
  };
}

/**
 * Xác định mùa hiện tại dựa trên tháng
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Xác định phân khúc giá dựa trên giá trung bình
 */
function determinePriceSegment(avgPrice: number): 'budget' | 'midrange' | 'premium' | 'luxury' {
  if (avgPrice < 500000) return 'budget';
  if (avgPrice < 2000000) return 'midrange';
  if (avgPrice < 10000000) return 'premium';
  return 'luxury';
}

/**
 * Xác định tần suất mua hàng dựa trên số lượng đơn hàng và thời gian
 */
function determinePurchaseFrequency(orders: any[], timeSpanMonths: number = 12): 'rare' | 'occasional' | 'frequent' {
  const orderCount = orders.length;
  const ordersPerMonth = orderCount / timeSpanMonths;
  
  if (ordersPerMonth < 0.5) return 'rare'; // Ít hơn 1 đơn hàng mỗi 2 tháng
  if (ordersPerMonth < 2) return 'occasional'; // 1-2 đơn hàng mỗi tháng
  return 'frequent'; // Nhiều hơn 2 đơn hàng mỗi tháng
}

/**
 * Tính tỷ lệ giỏ hàng bị bỏ quên
 */
function calculateCartAbandonRate(completedCarts: number, abandonedCarts: number): number {
  const totalCarts = completedCarts + abandonedCarts;
  if (totalCarts === 0) return 0;
  return abandonedCarts / totalCarts;
}

/**
 * Tạo mô hình hành vi người dùng từ dữ liệu gốc
 * @param userId - ID người dùng
 * @param data - Dữ liệu hành vi người dùng
 * @returns Mô hình hành vi người dùng
 */
export function buildUserBehaviorModel(
  userId: string,
  data: {
    productViews: (ProductView & { 
      product: Product & { 
        category: Category
      } 
    })[];
    searchQueries: SearchQuery[];
    orders: (Order & { 
      items: (OrderItem & { 
        product: Product & {
          category: Category
        }
      })[];
    })[];
    abandonedCarts: any[];
    wishlistItems: any[];
  }
): UserBehaviorModel {
  const { productViews, searchQueries, orders, abandonedCarts, wishlistItems } = data;

  // 1. Phân tích danh mục yêu thích với trọng số cải tiến
  const categoryScores = new Map<string, number>();
  
  // Tính điểm từ lượt xem với trọng số thời gian xem và độ gần đây
  productViews.forEach(view => {
    const category = view.product.category;
    const currentScore = categoryScores.get(category.id) || 0;
    
    // Điểm dựa trên số lượt xem và mức độ gần đây
    const daysSinceViewed = (Date.now() - new Date(view.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    // Cải tiến: Trọng số phi tuyến giảm dần theo đường cong sigmoid
    const recencyFactor = 1 / (1 + Math.exp(0.1 * (daysSinceViewed - 30)));
    
    // Trọng số thời gian xem: xem càng lâu càng quan trọng với ngưỡng tốt hơn
    const durationWeight = view.duration ? Math.min(2.0, 1 + (view.duration / 90)) : 1;
    
    // Trọng số tương tác: nếu thêm vào giỏ hàng hoặc danh sách yêu thích sau khi xem
    const interactionFound = wishlistItems.some(item => item.product.id === view.productId);
    const interactionWeight = interactionFound ? 1.5 : 1.0;
    
    const viewScore = view.viewCount * recencyFactor * durationWeight * interactionWeight;
    categoryScores.set(category.id, currentScore + viewScore);
  });
  
  // Tính điểm từ lịch sử mua hàng (cao hơn lượt xem)
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.product;
      if (!product) return;
      
      const currentScore = categoryScores.get(product.categoryId) || 0;
      
      // Thời gian mua
      const daysSincePurchase = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      // Sử dụng hàm logarit để giảm tác động theo thời gian
      const purchaseRecency = 1 / (1 + Math.log(1 + daysSincePurchase / 30));
      
      // Tính toán trọng số dựa trên giá trị đơn hàng
      const valueWeight = Math.min(2.0, 1 + (item.price * item.quantity) / 1000000);
      
      // Mua một sản phẩm có điểm cao hơn chỉ xem (x10)
      categoryScores.set(product.categoryId, currentScore + (item.quantity * 10 * purchaseRecency * valueWeight));
    });
  });
  
  // Thêm điểm từ danh sách yêu thích
  wishlistItems.forEach(item => {
    const category = item.product.category;
    const currentScore = categoryScores.get(category.id) || 0;
    categoryScores.set(category.id, currentScore + 5); // Thêm điểm cố định cho danh mục trong wishlist
  });
  
  // 2. Phân tích thương hiệu ưa thích
  const brandScores = new Map<string, number>();
  
  // Sử dụng brandId từ product nếu có
  productViews.forEach(view => {
    if (!view.product.categoryId) return;
    
    // Sử dụng categoryId như là brandId tạm thời
    const brandId = view.product.categoryId;
    const currentScore = brandScores.get(brandId) || 0;
    
    const daysSinceViewed = (Date.now() - new Date(view.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = 1 / (1 + Math.exp(0.1 * (daysSinceViewed - 30)));
    
    brandScores.set(brandId, currentScore + (view.viewCount * recencyFactor));
  });
  
  // Điểm từ mua hàng (cao hơn)
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.product;
      if (!product) return;
      
      // Sử dụng categoryId như là brandId tạm thời
      const brandId = product.categoryId;
      const currentScore = brandScores.get(brandId) || 0;
      
      const daysSincePurchase = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const purchaseRecency = 1 / (1 + Math.log(1 + daysSincePurchase / 30));
      
      brandScores.set(brandId, currentScore + (item.quantity * 8 * purchaseRecency));
    });
  });
  
  // 3. Phân tích sở thích giá cả
  let totalPrice = 0;
  let numPrices = 0;
  let minPrice = Number.MAX_VALUE;
  let maxPrice = 0;
  
  // Tính trọng số cho giá các sản phẩm đã mua (cao hơn)
  const viewedPrices: number[] = [];
  const purchasedPrices: number[] = [];
  
  // Xem xét cả sản phẩm đã xem
  productViews.forEach(view => {
    const price = view.product.price;
    viewedPrices.push(price);
    totalPrice += price;
    numPrices++;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });
  
  // Xem xét cả sản phẩm đã mua với trọng số cao hơn
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.product) return;
      const price = item.product.price;
      purchasedPrices.push(price);
      totalPrice += price * 3; // Tăng trọng số cho sản phẩm đã mua
      numPrices += 3;
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });
  });
  
  // Điều chỉnh min/max nếu không có dữ liệu
  if (numPrices === 0) {
    minPrice = 0;
    maxPrice = 1000000;
  }
  
  const avgPrice = numPrices > 0 ? totalPrice / numPrices : 0;
  const priceSegment = determinePriceSegment(avgPrice);
  
  // 4. Phân tích mẫu hành vi theo thời gian
  const timeOfDay: Record<string, number> = {
    morning: 0,   // 5-11 giờ
    afternoon: 0, // 12-17 giờ
    evening: 0,   // 18-22 giờ
    night: 0      // 23-4 giờ
  };
  
  const dayOfWeek: Record<string, number> = {
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
    friday: 0, saturday: 0, sunday: 0
  };
  
  // Tính thời gian xem trung bình
  let totalViewDuration = 0;
  let viewCount = 0;
  
  // Phân tích thời gian xem sản phẩm
  productViews.forEach(view => {
    const date = new Date(view.updatedAt);
    const hour = date.getHours();
    const day = date.getDay();
    
    // Phân loại thời gian trong ngày
    if (hour >= 5 && hour < 12) timeOfDay.morning += view.viewCount;
    else if (hour >= 12 && hour < 18) timeOfDay.afternoon += view.viewCount;
    else if (hour >= 18 && hour < 23) timeOfDay.evening += view.viewCount;
    else timeOfDay.night += view.viewCount;
    
    // Phân loại ngày trong tuần
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayOfWeek[days[day]] += view.viewCount;
    
    // Tính tổng thời gian xem
    if (view.duration) {
      totalViewDuration += view.duration * view.viewCount;
      viewCount += view.viewCount;
    }
  });
  
  // Tính thời gian xem trung bình
  const avgViewDuration = viewCount > 0 ? totalViewDuration / viewCount : 0;
  
  // Xác định tần suất xem
  const viewsPerWeek = productViews.reduce((sum, view) => sum + view.viewCount, 0) / 4; // chia cho 4 tuần
  const viewFrequency = viewsPerWeek < 3 ? 'low' : (viewsPerWeek < 10 ? 'medium' : 'high');
  
  // 5. Phân tích mùa vụ và xu hướng theo mùa
  const currentSeason = getCurrentSeason();
  
  // Thu thập lịch sử theo mùa
  const historicalSeasonalInterests: Record<string, string[]> = {
    spring: [],
    summer: [],
    autumn: [],
    winter: []
  };
  
  // Phân loại đơn hàng theo mùa
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const month = orderDate.getMonth() + 1;
    let season;
    
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';
    
    // Thu thập danh mục sản phẩm mua theo mùa
    order.items.forEach(item => {
      if (!item.product || !item.product.categoryId) return;
      if (!historicalSeasonalInterests[season].includes(item.product.categoryId)) {
        historicalSeasonalInterests[season].push(item.product.categoryId);
      }
    });
  });
  
  // Xác định các danh mục theo mùa dựa trên hành vi gần đây
  const seasonalCategories = historicalSeasonalInterests[currentSeason].length > 0 
    ? historicalSeasonalInterests[currentSeason] 
    : Array.from(categoryScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);
  
  // 6. Phân tích từ khóa tìm kiếm
  const recentSearches = searchQueries.map(query => query.query);
  
  // 7. Phân tích hành vi mua hàng
  // Tính giá trị đơn hàng trung bình
  const totalOrderValue = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);
  const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
  
  // Tìm phương thức thanh toán ưa thích
  const paymentMethods: Record<string, number> = {};
  orders.forEach(order => {
    if (!order.paymentMethod) return;
    const method = order.paymentMethod;
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });
  
  const preferredPaymentMethod = Object.entries(paymentMethods)
    .sort((a, b) => b[1] - a[1])
    .map(([method]) => method)[0] || '';
  
  // Tính tỷ lệ giỏ hàng bị bỏ quên
  const cartAbandonRate = calculateCartAbandonRate(orders.length, abandonedCarts.length);
  
  // Tạo ra mô hình người dùng tổng hợp
  return {
    userId,
    favoriteCategories: Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ id, score })),
    pricePreference: {
      minPrice,
      maxPrice,
      avgPrice,
      priceSegment
    },
    recentSearches,
    viewPatterns: {
      timeOfDay,
      dayOfWeek,
      avgViewDuration,
      frequency: viewFrequency
    },
    seasonalPreferences: {
      currentSeason,
      seasonalCategories,
      historicalSeasonalInterests
    },
    brandAffinities: Array.from(brandScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([brandId, score]) => ({ brandId, score })),
    interactionRecency: {
      lastView: productViews.length > 0 ? new Date(productViews[0].updatedAt) : new Date(),
      lastSearch: searchQueries.length > 0 ? new Date(searchQueries[0].createdAt) : new Date(),
      lastPurchase: orders.length > 0 ? new Date(orders[0].createdAt) : new Date()
    },
    purchaseBehavior: {
      frequency: determinePurchaseFrequency(orders),
      avgOrderValue,
      preferredPaymentMethod,
      cartAbandonRate
    },
    lastActive: productViews.length > 0 
      ? new Date(productViews[0].updatedAt) 
      : new Date()
  };
}

/**
 * Cập nhật hoặc tạo phân tích hành vi người dùng trong cơ sở dữ liệu
 * @param userId - ID người dùng
 * @returns True nếu cập nhật thành công
 */
export async function updateUserBehaviorAnalysis(userId: string): Promise<boolean> {
  try {
    // Lấy dữ liệu hành vi người dùng
    const behaviorData = await getUserBehaviorData(userId);
    
    // Xây dựng mô hình hành vi
    const behaviorModel = buildUserBehaviorModel(userId, behaviorData);
    
    // Chuẩn bị dữ liệu để lưu vào cơ sở dữ liệu
    const topCategories = behaviorModel.favoriteCategories.map(cat => cat.id).join(',');
    const topBrands = behaviorModel.brandAffinities.map(brand => brand.brandId).join(',');
    
    // Tạo mô tả về sở thích sản phẩm
    const priceRange = `${behaviorModel.pricePreference.minPrice}-${behaviorModel.pricePreference.maxPrice}`;
    const productPreferences = `Giá: ${priceRange}; TB: ${Math.round(behaviorModel.pricePreference.avgPrice)}; Phân khúc: ${behaviorModel.pricePreference.priceSegment}`;
    
    // Tạo mô tả về mẫu mua sắm
    const favoriteTime = Object.entries(behaviorModel.viewPatterns.timeOfDay)
      .sort((a, b) => b[1] - a[1])[0][0];
    const favoriteDay = Object.entries(behaviorModel.viewPatterns.dayOfWeek)
      .sort((a, b) => b[1] - a[1])[0][0];
    const shoppingPatterns = `Thời gian: ${favoriteTime}; Ngày: ${favoriteDay}; Mùa: ${behaviorModel.seasonalPreferences.currentSeason}; Xem: ${behaviorModel.viewPatterns.frequency}`;
    
    // Tạo chiến lược tiếp thị
    const marketingStrategies = behaviorModel.favoriteCategories.length > 0
      ? `Quảng cáo danh mục: ${topCategories.split(',').slice(0, 3).join(', ')}; 
         Thương hiệu: ${topBrands.split(',').slice(0, 3).join(', ')}; 
         Định giá: ${behaviorModel.pricePreference.priceSegment}; 
         Ưu đãi theo mùa: ${behaviorModel.seasonalPreferences.currentSeason};
         Tần suất mua: ${behaviorModel.purchaseBehavior.frequency}`
      : 'Chưa có đủ dữ liệu';
    
    // Lưu thêm các chỉ số hành vi mới
    const behaviorMetrics = JSON.stringify({
      avgViewDuration: behaviorModel.viewPatterns.avgViewDuration,
      cartAbandonRate: behaviorModel.purchaseBehavior.cartAbandonRate,
      avgOrderValue: behaviorModel.purchaseBehavior.avgOrderValue,
      seasonalInterests: behaviorModel.seasonalPreferences.historicalSeasonalInterests,
      brandAffinities: behaviorModel.brandAffinities.slice(0, 10)
    });
    
    try {
      // Cập nhật vào cơ sở dữ liệu sử dụng raw query để tránh vấn đề với model casing
      await prisma.$transaction(async (tx) => {
        // Kiểm tra xem bản ghi đã tồn tại hay chưa
        const existingRecord = await tx.$queryRaw`
          SELECT TOP 1 "id" FROM "UserBehaviorAnalysis" WHERE "userId" = ${userId}
        `;
        
        if (Array.isArray(existingRecord) && existingRecord.length > 0) {
          // Cập nhật bản ghi hiện có
          await tx.$executeRaw`
            UPDATE "UserBehaviorAnalysis"
            SET 
              "topCategories" = ${topCategories},
              "topBrands" = ${topBrands},
              "productPreferences" = ${productPreferences},
              "shoppingPatterns" = ${shoppingPatterns},
              "marketingStrategies" = ${marketingStrategies},
              "behaviorMetrics" = ${behaviorMetrics},
              "updatedAt" = ${new Date()}
            WHERE "userId" = ${userId}
          `;
        } else {
          // Tạo bản ghi mới
          await tx.$executeRaw`
            INSERT INTO "UserBehaviorAnalysis" (
              "id", "userId", "topCategories", "topBrands", 
              "productPreferences", "shoppingPatterns", "marketingStrategies", 
              "behaviorMetrics", "createdAt", "updatedAt"
            ) VALUES (
              NEWID(), ${userId}, ${topCategories}, ${topBrands},
              ${productPreferences}, ${shoppingPatterns}, ${marketingStrategies},
              ${behaviorMetrics}, ${new Date()}, ${new Date()}
            )
          `;
        }
      });
      
      return true;
    } catch (dbError) {
      console.error('Lỗi cơ sở dữ liệu:', dbError);
      // Thử cách khác: sử dụng $executeRawUnsafe nếu cách trên không hoạt động
      try {
        // Cập nhật hoặc chèn dữ liệu
        await prisma.$executeRawUnsafe(`
          MERGE INTO "UserBehaviorAnalysis" AS target
          USING (SELECT @p1 as userId) AS source
          ON target."userId" = source.userId
          WHEN MATCHED THEN
            UPDATE SET 
              "topCategories" = @p2,
              "topBrands" = @p3,
              "productPreferences" = @p4,
              "shoppingPatterns" = @p5,
              "marketingStrategies" = @p6,
              "behaviorMetrics" = @p7,
              "updatedAt" = @p8
          WHEN NOT MATCHED THEN
            INSERT (
              "id", "userId", "topCategories", "topBrands", 
              "productPreferences", "shoppingPatterns", "marketingStrategies", 
              "behaviorMetrics", "createdAt", "updatedAt"
            )
            VALUES (
              NEWID(), @p1, @p2, @p3,
              @p4, @p5, @p6,
              @p7, @p8, @p8
            );
        `, 
        userId, 
        topCategories, 
        topBrands, 
        productPreferences, 
        shoppingPatterns, 
        marketingStrategies, 
        behaviorMetrics, 
        new Date());
        
        return true;
      } catch (finalError) {
        console.error('Lỗi thứ cấp khi cập nhật phân tích hành vi:', finalError);
        return false;
      }
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật phân tích hành vi người dùng:', error);
    return false;
  }
} 