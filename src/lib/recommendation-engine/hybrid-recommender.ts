/**
 * Module tích hợp các thuật toán gợi ý khác nhau thành một hệ thống gợi ý lai (Hybrid Recommender)
 * Kết hợp TensorFlow.js, Collaborative Filtering, Content-Based Filtering, và Matrix Factorization
 */
import * as tf from '@tensorflow/tfjs';
import prisma from "@/lib/prisma";
import { getSmartRecommendations } from "./tf-prediction";
import { getContentBasedRecommendations } from "./content-based-filtering";
import { getCollaborativeRecommendations } from "./collaborative-filtering";
import { getMatrixFactorizationRecommendations } from "./matrix-factorization";
import { logRecommendationInteraction } from "../recommendation-engine/recommendation-metrics";

/**
 * Kết quả từ một thuật toán gợi ý
 */
type RecommendationResult = {
  productIds: string[];
  algorithm: 'tensorflow' | 'collaborative' | 'content' | 'matrix' | 'popular' | 'hybrid';
  confidence: number; // 0-1
};

/**
 * Cấu trúc vector trọng số cho từng thuật toán gợi ý
 */
type AlgorithmWeights = {
  tensorflow: number;
  collaborative: number;
  content: number;
  matrix: number;
  popular: number;
};

/**
 * Cấu hình mặc định cho trọng số các thuật toán
 */
const DEFAULT_WEIGHTS: AlgorithmWeights = {
  tensorflow: 1.0,     // Deep Learning
  collaborative: 0.8,  // Lọc cộng tác
  content: 0.7,        // Lọc theo nội dung
  matrix: 0.9,         // Ma trận phân tích
  popular: 0.5         // Phổ biến nhất (fallback)
};

/**
 * Lấy danh sách sản phẩm phổ biến làm fallback
 */
async function getPopularProducts(
  limit: number = 10,
  contextData: {
    categoryId?: string,
    priceRange?: { min: number, max: number },
    searchQuery?: string,
    currentPage?: string,
    seasonFocus?: boolean
  } = {}
): Promise<string[]> {
  // Build where conditions based on context
  const whereConditions: any = { stock: { gt: 0 } };
  
  // Apply category filter if specified
  if (contextData.categoryId) {
    whereConditions.categoryId = contextData.categoryId;
  }
  
  // Apply price range filter if specified
  if (contextData.priceRange) {
    whereConditions.price = {
      gte: contextData.priceRange.min,
      lte: contextData.priceRange.max
    };
  }
  
  // Search products
  const popularProducts = await prisma.product.findMany({
    where: whereConditions,
    orderBy: {
      productViews: {
        _count: 'desc'
      }
    },
    take: limit,
    select: {
      id: true
    }
  });
  
  return popularProducts.map(p => p.id);
}

/**
 * Tính điểm cho sản phẩm dựa trên xếp hạng và trọng số thuật toán
 */
function calculateProductScores(
  recommendationResults: RecommendationResult[],
  weights: AlgorithmWeights = DEFAULT_WEIGHTS
): Map<string, number> {
  const productScores = new Map<string, number>();
  
  // Điểm số dựa trên xếp hạng (vị trí) trong danh sách
  recommendationResults.forEach(result => {
    // Lấy trọng số cho thuật toán
    let algorithmWeight = 0;
    switch (result.algorithm) {
      case 'tensorflow': algorithmWeight = weights.tensorflow; break;
      case 'collaborative': algorithmWeight = weights.collaborative; break;
      case 'content': algorithmWeight = weights.content; break;
      case 'matrix': algorithmWeight = weights.matrix; break;
      case 'popular': algorithmWeight = weights.popular; break;
      default: algorithmWeight = 0.5;
    }
    
    // Tính điểm cho từng sản phẩm dựa trên thứ hạng và trọng số thuật toán
    result.productIds.forEach((productId, index) => {
      // Điểm dựa trên vị trí (rank), chuẩn hóa về 0-1
      const rankScore = 1 - (index / result.productIds.length);
      
      // Điểm sản phẩm = trọng số thuật toán * điểm xếp hạng * độ tin cậy
      const score = algorithmWeight * rankScore * result.confidence;
      
      // Cộng điểm vào tổng
      productScores.set(
        productId, 
        (productScores.get(productId) || 0) + score
      );
    });
  });
  
  return productScores;
}

/**
 * Tối ưu hóa trọng số thuật toán dựa trên dữ liệu tương tác gợi ý
 */
export async function optimizeAlgorithmWeights(): Promise<AlgorithmWeights> {
  try {
    // Lấy dữ liệu tương tác gợi ý gần đây
    const recentInteractions = await prisma.recommendationInteraction.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 ngày gần đây
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    // Nếu không có đủ dữ liệu, trả về trọng số mặc định
    if (recentInteractions.length < 100) {
      return DEFAULT_WEIGHTS;
    }
    
    // Đếm lượt tương tác theo thuật toán và loại tương tác
    const algorithmStats = new Map<string, {
      views: number;
      carts: number;
      purchases: number;
      total: number;
    }>();
    
    recentInteractions.forEach(interaction => {
      const type = interaction.recommendationType;
      
      if (!algorithmStats.has(type)) {
        algorithmStats.set(type, { views: 0, carts: 0, purchases: 0, total: 0 });
      }
      
      const stats = algorithmStats.get(type)!;
      
      switch (interaction.interactionType) {
        case 'view': stats.views++; break;
        case 'cart': stats.carts++; break;
        case 'purchase': stats.purchases++; break;
      }
      
      stats.total++;
    });
    
    // Tính điểm hiệu quả cho từng thuật toán
    const algorithmEffectiveness = new Map<string, number>();
    
    algorithmStats.forEach((stats, algorithm) => {
      // Công thức: (tỷ lệ giỏ hàng * 2 + tỷ lệ mua * 4) / 3
      // Điều này đặt mua hàng cao hơn thêm vào giỏ, cao hơn lượt xem
      const cartRate = stats.total > 0 ? stats.carts / stats.total : 0;
      const purchaseRate = stats.total > 0 ? stats.purchases / stats.total : 0;
      
      const effectiveness = (cartRate * 2 + purchaseRate * 4) / 3;
      algorithmEffectiveness.set(algorithm, effectiveness);
    });
    
    // Map các thuật toán từ API vào các trọng số
    const weights: AlgorithmWeights = { ...DEFAULT_WEIGHTS };
    
    // Điều chỉnh trọng số dựa trên dữ liệu
    algorithmEffectiveness.forEach((score, algorithm) => {
      if (algorithm === 'ai_personalized') {
        weights.tensorflow = score * 1.5; // Tối đa 1.5
      } else if (algorithm === 'collaborative' || algorithm === 'item_based') {
        weights.collaborative = score * 1.5;
      } else if (algorithm === 'content_based') {
        weights.content = score * 1.5;
      } else if (algorithm === 'matrix') {
        weights.matrix = score * 1.5;
      } else if (algorithm === 'popular') {
        weights.popular = score * 1.0; // Tối đa 1.0 cho popular
      }
    });
    
    // Đảm bảo các trọng số >= 0.3 và <= 1.5
    Object.keys(weights).forEach(key => {
      const k = key as keyof AlgorithmWeights;
      weights[k] = Math.max(0.3, Math.min(1.5, weights[k]));
    });
    
    return weights;
  } catch (error) {
    console.error('Lỗi khi tối ưu hóa trọng số thuật toán:', error);
    return DEFAULT_WEIGHTS;
  }
}

/**
 * Lọc bỏ các sản phẩm người dùng đã tương tác
 */
async function filterInteractedProducts(
  userId: string,
  productIds: string[],
  days: number = 30
): Promise<string[]> {
  try {
    // Lấy danh sách sản phẩm người dùng đã xem
    const viewedProducts = await prisma.productView.findMany({
      where: { userId },
      select: { productId: true }
    });
    
    // Lấy danh sách sản phẩm trong giỏ hàng hiện tại
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      select: { productId: true }
    });
    
    // Lấy danh sách sản phẩm đã mua
    const purchasedProducts = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: 'COMPLETED'
        }
      },
      select: { productId: true }
    });
    
    // Tập hợp tất cả sản phẩm đã tương tác
    const interactedProductIds = new Set([
      ...viewedProducts.map(p => p.productId),
      ...cartItems.map(p => p.productId),
      ...purchasedProducts.map(p => p.productId)
    ]);
    
    // Lọc bỏ các sản phẩm đã tương tác
    return productIds.filter(id => {
      const interactionDate = new Date(viewedProducts.find(p => p.productId === id)?.timestamp || 0);
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return !interactedProductIds.has(id) && interactionDate > daysAgo;
    });
  } catch (error) {
    console.error('Lỗi khi lọc sản phẩm đã tương tác:', error);
    return productIds;
  }
}

/**
 * Lấy khuyến nghị sản phẩm thông minh bằng thuật toán hybrid
 */
export async function getHybridRecommendations(
  userId: string,
  limit: number = 10,
  filterInteracted: boolean = true,
  contextData: {
    categoryId?: string,
    priceRange?: { min: number, max: number },
    searchQuery?: string,
    currentPage?: string,
    seasonFocus?: boolean
  } = {}
): Promise<{ productIds: string[]; algorithm: string }> {
  try {
    // Cấu hình trọng số cho các thuật toán
    const weights: AlgorithmWeights = { ...DEFAULT_WEIGHTS };
    
    // Lấy thông tin phân tích hành vi người dùng để điều chỉnh trọng số động
    let userBehaviorRecord = null;
    try {
      userBehaviorRecord = await prisma.userBehaviorAnalysis.findFirst({
        where: { userId }
      });
    } catch (dbError) {
      console.error('Error fetching user behavior analysis:', dbError);
      userBehaviorRecord = null;
    }
    
    // Điều chỉnh trọng số dựa trên phân tích người dùng
    let dynamicWeights = { ...weights };
    
    if (userBehaviorRecord) {
      try {
        // Kích hoạt model TensorFlow nếu user có đủ dữ liệu hành vi
        if (userBehaviorRecord.behaviorMetrics) {
          const metrics = JSON.parse(userBehaviorRecord.behaviorMetrics);
          
          // Nếu người dùng có tần suất mua hàng cao, tăng trọng số cho TF
          if (metrics.purchaseFrequency === 'frequent') {
            dynamicWeights.tensorflow *= 1.2;
          }
          
          // Nếu người dùng có tỷ lệ bỏ giỏ hàng thấp, tăng trọng số cho CF
          if (metrics.cartAbandonRate < 0.3) {
            dynamicWeights.collaborative *= 1.2;
          }
          
          // Nếu người dùng có sở thích thương hiệu rõ rệt, tăng trọng số cho CBF
          if (userBehaviorRecord.topBrands && userBehaviorRecord.topBrands.split(',').length > 2) {
            dynamicWeights.content *= 1.2;
          }
        }
      } catch (error) {
        console.error('Lỗi khi phân tích behavior metrics:', error);
      }
    }
    
    // Điều chỉnh trọng số theo ngữ cảnh hiện tại
    if (contextData.categoryId) {
      // Nếu người dùng đang xem một danh mục cụ thể, tăng trọng số cho content-based
      dynamicWeights.content *= 1.3;
    }
    
    if (contextData.searchQuery) {
      // Nếu người dùng vừa tìm kiếm, tăng trọng số cho content-based
      dynamicWeights.content *= 1.2;
    }
    
    if (contextData.seasonFocus) {
      // Nếu đang trong mùa đặc biệt (lễ, tết...), tăng trọng số cho popular
      dynamicWeights.popular *= 1.4;
    }
    
    const results: RecommendationResult[] = [];
    
    // 1. Gọi các thuật toán song song để tăng tốc độ
    // Thêm thông tin ngữ cảnh vào các cuộc gọi API
    const [tfResults, collaborativeResults, contentResults, matrixResults, popularResults] = await Promise.all([
      // TensorFlow.js (Deep Learning)
      getSmartRecommendations(userId, Math.min(limit * 2, 20), contextData)
        .then(products => ({
          productIds: products.map(p => typeof p === 'string' ? p : p.id),
          algorithm: 'tensorflow' as const,
          confidence: 0.9
        }))
        .catch((error) => {
          console.error('Lỗi khi lấy gợi ý TensorFlow:', error);
          return { productIds: [], algorithm: 'tensorflow' as const, confidence: 0 };
        }),
      
      // Collaborative Filtering với ngữ cảnh
      getCollaborativeRecommendations(userId, Math.min(limit * 2, 20), contextData)
        .then(productIds => ({
          productIds,
          algorithm: 'collaborative' as const,
          confidence: 0.85
        }))
        .catch((error) => {
          console.error('Lỗi khi lấy gợi ý Collaborative:', error);
          return { productIds: [], algorithm: 'collaborative' as const, confidence: 0 };
        }),
      
      // Content-Based Filtering với ngữ cảnh
      getContentBasedRecommendations(userId, Math.min(limit * 2, 20), contextData)
        .then(productIds => ({
          productIds,
          algorithm: 'content' as const,
          confidence: 0.7
        }))
        .catch((error) => {
          console.error('Lỗi khi lấy gợi ý Content-Based:', error);
          return { productIds: [], algorithm: 'content' as const, confidence: 0 };
        }),
      
      // Matrix Factorization
      getMatrixFactorizationRecommendations(userId, Math.min(limit * 2, 20), contextData)
        .then(productIds => ({
          productIds,
          algorithm: 'matrix' as const,
          confidence: 0.8
        }))
        .catch((error) => {
          console.error('Lỗi khi lấy gợi ý Matrix Factorization:', error);
          return { productIds: [], algorithm: 'matrix' as const, confidence: 0 };
        }),
      
      // Sản phẩm phổ biến (fallback)
      getPopularProducts(Math.min(limit * 2, 20), contextData)
        .then(productIds => ({
          productIds,
          algorithm: 'popular' as const,
          confidence: 0.5
        }))
        .catch((error) => {
          console.error('Lỗi khi lấy sản phẩm phổ biến:', error);
          return { productIds: [], algorithm: 'popular' as const, confidence: 0 };
        })
    ]);
    
    // 2. Thêm các kết quả vào mảng
    results.push(tfResults, collaborativeResults, contentResults, matrixResults, popularResults);
    
    // 3. Loại bỏ kết quả rỗng từ các thuật toán thất bại
    const validResults = results.filter(result => result.productIds.length > 0);
    
    // Nếu không có thuật toán nào trả về kết quả, trả về sản phẩm phổ biến
    if (validResults.length === 0) {
      return {
        productIds: (await getPopularProducts(limit, contextData)),
        algorithm: 'popular'
      };
    }
    
    // 4. Tạo danh sách sản phẩm được xếp hạng với trọng số từ nhiều thuật toán
    const productScores: Map<string, { score: number, sources: string[] }> = new Map();
    
    // Tính điểm cho mỗi sản phẩm dựa trên độ tin cậy và trọng số thuật toán
    for (const result of validResults) {
      // Tính trọng số cho thuật toán cụ thể này
      const algorithmWeight = dynamicWeights[result.algorithm] * result.confidence;
      
      // Điểm giảm dần theo vị trí trong mảng kết quả
      for (let i = 0; i < result.productIds.length; i++) {
        const productId = result.productIds[i];
        // Điểm giảm dần theo vị trí: 1.0 -> 0.5 -> 0.33 -> ...
        const positionScore = 1 / (i/10 + 1);
        const finalScore = algorithmWeight * positionScore;
        
        if (productScores.has(productId)) {
          // Nếu sản phẩm đã được khuyến nghị bởi thuật toán khác, cộng dồn điểm
          const existing = productScores.get(productId)!;
          existing.score += finalScore;
          existing.sources.push(result.algorithm);
        } else {
          // Nếu đây là lần đầu tiên sản phẩm được khuyến nghị
          productScores.set(productId, {
            score: finalScore,
            sources: [result.algorithm]
          });
        }
      }
    }
    
    // Nếu cần lọc bỏ các sản phẩm người dùng đã tương tác
    if (filterInteracted) {
      try {
        // Lấy danh sách sản phẩm người dùng đã xem
        const viewed = await prisma.productView.findMany({
          where: { userId },
          select: { productId: true }
        });
        
        // Lọc bỏ các sản phẩm đã xem
        for (const view of viewed) {
          productScores.delete(view.productId);
        }
    } catch (error) {
        console.error('Lỗi khi lọc sản phẩm đã tương tác:', error);
      }
    }
    
    // 5. Sắp xếp theo điểm và chọn top N sản phẩm
    const topProducts = Array.from(productScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([productId]) => productId);
    
    // Thuật toán lai (hybrid) kết hợp nhiều nguồn
    return {
      productIds: topProducts,
      algorithm: 'hybrid'
    };
  } catch (error) {
    console.error('Lỗi trong Hybrid Recommender:', error);
    // Fallback to popular products in case of error
    try {
      const popularProductIds = await getPopularProducts(limit, contextData);
      return {
        productIds: popularProductIds,
        algorithm: 'popular_fallback'
      };
    } catch (fallbackError) {
      console.error('Lỗi khi lấy sản phẩm phổ biến làm fallback:', fallbackError);
    return {
        productIds: [],
        algorithm: 'error'
    };
    }
  }
}

/**
 * Lấy chi tiết sản phẩm từ danh sách ID
 */
export async function getProductDetails(productIds: string[]): Promise<any[]> {
  if (productIds.length === 0) return [];
  
  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        stock: { gt: 0 } // Chỉ lấy sản phẩm còn hàng
      },
      include: {
        category: true
      }
    });
    
    // Sắp xếp sản phẩm theo thứ tự trong danh sách ID
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Giữ nguyên thứ tự từ danh sách ID ban đầu
    return productIds
      .map(id => productMap.get(id))
      .filter(p => p !== undefined);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    return [];
  }
}

/**
 * Lấy sản phẩm được gợi ý cho người dùng - API chính
 */
export async function getRecommendedProducts(
  userId: string,
  type: string = 'hybrid',
  limit: number = 10,
  contextData: {
      categoryId?: string,
      priceRange?: { min: number, max: number },
      searchQuery?: string,
      currentPage?: string,
      seasonFocus?: boolean
  } = {}
): Promise<any[]> {
  try {
    let result: any[] = [];
    
    // Build basic where conditions
    const whereConditions: any = {
      stock: { gt: 0 }
    };
    
    // Apply category filter if specified in context
    if (contextData.categoryId) {
      whereConditions.categoryId = contextData.categoryId;
    }
    
    // Apply price range filter if specified in context
    if (contextData.priceRange) {
      whereConditions.price = {
        gte: contextData.priceRange.min,
        lte: contextData.priceRange.max
      };
    }
    
    // Lựa chọn thuật toán dựa trên tham số type
    switch (type) {
      case 'tensorflow':
        const smartProducts = await getSmartRecommendations(userId, limit, contextData);
        result = smartProducts.map(p => typeof p === 'string' ? p : p.id);
        break;
        
      case 'collaborative':
        result = await getCollaborativeRecommendations(userId, limit, contextData);
        break;
        
      case 'content':
        result = await getContentBasedRecommendations(userId, limit, contextData);
        break;
        
      case 'matrix':
        result = await getMatrixFactorizationRecommendations(userId, limit, contextData);
        break;
        
      case 'popular':
        result = await getPopularProducts(limit, contextData);
        break;
        
      case 'hybrid':
      default:
        const hybridResult = await getHybridRecommendations(userId, limit, true, contextData);
        result = hybridResult.productIds;
        break;
    }
    
    // Nếu không có sản phẩm nào được gợi ý, sử dụng sản phẩm phổ biến
    if (result.length === 0) {
      result = await getPopularProducts(limit, contextData);
    }
    
    // Lấy thông tin chi tiết sản phẩm từ ID
    let products = [];
    
    if (result.length > 0) {
      try {
        products = await prisma.product.findMany({
          where: {
            id: { in: result },
            stock: { gt: 0 } // Chỉ lấy sản phẩm còn hàng
          },
          include: {
            category: true,
            images: true,
            productViews: {
              select: {
                viewCount: true
              },
              take: 1
            }
          }
        });
        
        // Sắp xếp kết quả theo thứ tự result
        const productMap = new Map(products.map(p => [p.id, p]));
        products = result
          .map(id => productMap.get(id))
          .filter(p => p); // Lọc bỏ undefined
      } catch (dbError) {
        console.error('Lỗi khi truy vấn thông tin sản phẩm:', dbError);
      }
    }
    
    // Lưu lịch sử gợi ý vào DB để phân tích hiệu suất
    try {
      await prisma.recommendationLog.create({
          data: {
            userId,
            recommendationType: type,
          productCount: products.length,
          categoryIds: products.map(p => p.categoryId).join(','),
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Lỗi khi ghi log gợi ý:', logError);
    }
    
    // Tạo thêm thông tin phân tích hành vi người dùng để phục vụ cho lần gợi ý tiếp theo
    try {
      const userBehaviorRecord = await prisma.userBehaviorAnalysis.findFirst({
        where: { userId }
      });
      
      if (!userBehaviorRecord) {
        // Nếu chưa có bản ghi phân tích, tạo mới
        const userBehaviorData = await getUserBehaviorAnalysis(userId);
        
        if (userBehaviorData) {
          await prisma.userBehaviorAnalysis.create({
            data: {
              userId,
              topCategories: userBehaviorData.topCategories.join(','),
              topBrands: userBehaviorData.topBrands.join(','),
              pricePreference: JSON.stringify(userBehaviorData.pricePreference),
              behaviorMetrics: JSON.stringify(userBehaviorData.metrics),
              updatedAt: new Date()
          }
        });
      }
      }
    } catch (analyticError) {
      console.error('Lỗi khi phân tích hành vi người dùng:', analyticError);
    }
    
    return products;
    
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm gợi ý:', error);
    
    // Trả về sản phẩm phổ biến nếu có lỗi
    try {
      const popularProducts = await prisma.product.findMany({
        where: {
          stock: { gt: 0 }
        },
        orderBy: [
          { isFeatured: 'desc' }
        ],
        take: limit,
        include: {
          category: true,
          images: true
        }
      });
      
      return popularProducts;
    } catch (fallbackError) {
      console.error('Lỗi khi lấy sản phẩm phổ biến làm fallback:', fallbackError);
      return [];
    }
  }
}

/**
 * Phân tích hành vi người dùng để cá nhân hóa gợi ý
 */
async function getUserBehaviorAnalysis(userId: string) {
  try {
    // Lấy dữ liệu về lượt xem sản phẩm của người dùng
    const productViews = await prisma.productView.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });
    
    // Lấy dữ liệu về lịch sử mua hàng
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: 'COMPLETED'
        }
      },
      include: {
        product: {
        include: {
          category: true
        }
        }
      }
    });
    
    // Phân tích danh mục phổ biến
    const categoryCount: Record<string, number> = {};
    const prices: number[] = [];
    
    // Xử lý lượt xem
    productViews.forEach(view => {
      if (!view.product) return;
      
      const categoryId = view.product.categoryId;
      
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + view.viewCount;
      
      // Thêm giá vào mảng để phân tích
      prices.push(view.product.price);
    });
    
    // Xử lý lịch sử mua hàng (trọng số cao hơn)
    orderItems.forEach(item => {
      if (!item.product) return;
      
      const categoryId = item.product.categoryId;
      
      // Trọng số cho mua hàng cao hơn cho xem
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 5;
      
      // Thêm giá vào mảng
      prices.push(item.product.price);
    });
    
    // Sắp xếp và lấy top 5 danh mục/thương hiệu
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    
    // Phân tích sở thích giá cả
    const avgPrice = prices.length > 0 ? 
      prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    
    // Xác định phân khúc giá
    let priceSegment = 'unknown';
    if (avgPrice <= 50000) priceSegment = 'budget';
    else if (avgPrice <= 200000) priceSegment = 'midrange-low';
    else if (avgPrice <= 500000) priceSegment = 'midrange';
    else if (avgPrice <= 2000000) priceSegment = 'midrange-high';
    else if (avgPrice <= 10000000) priceSegment = 'premium';
    else priceSegment = 'luxury';
    
    // Tính các metrics bổ sung
    // Số lượng mua so với số lượng xem
    const viewToOrderRatio = productViews.length > 0 ? 
      orderItems.length / productViews.length : 0;
    
    // Nhận diện tần suất mua hàng
    let purchaseFrequency = 'none';
    if (orderItems.length >= 5) purchaseFrequency = 'frequent';
    else if (orderItems.length >= 2) purchaseFrequency = 'occasional';
    else if (orderItems.length >= 1) purchaseFrequency = 'rare';
    
    // Tỷ lệ bỏ giỏ hàng (từ dữ liệu cart)
    const cartItems = await prisma.cart.findMany({
      where: { userId }
    });
    
    const cartAbandonRate = cartItems.length > 0 ? 
      1 - (orderItems.length / cartItems.length) : 0;
    
      return {
      topCategories,
      topBrands: [],
      pricePreference: {
        avgPrice,
        priceSegment
      },
      metrics: {
        viewToOrderRatio,
        purchaseFrequency,
        cartAbandonRate,
        totalViews: productViews.length,
        totalOrders: orderItems.length
      }
    };
  } catch (error) {
    console.error('Lỗi khi phân tích hành vi người dùng:', error);
    return null;
  }
} 