/**
 * Module triển khai thuật toán Collaborative Filtering (Lọc cộng tác)
 * Sử dụng Item-based và User-based Collaborative Filtering
 */
import prisma from "@/lib/prisma";

/**
 * Cấu trúc dữ liệu Ma trận xếp hạng người dùng-sản phẩm
 * - Chỉ số ngoài là userId
 * - Chỉ số trong là productId và điểm xếp hạng (từ hành vi)
 */
type RatingMatrix = Map<string, Map<string, number>>;

/**
 * Cấu trúc lưu trữ độ tương đồng giữa các sản phẩm
 */
type ItemSimilarityMatrix = Map<string, Map<string, number>>;

/**
 * Xây dựng ma trận xếp hạng từ dữ liệu hành vi người dùng
 * Kết hợp các loại hành vi khác nhau (xem, mua, đánh giá) với trọng số phù hợp
 */
export async function buildRatingMatrix(): Promise<RatingMatrix> {
  const matrix: RatingMatrix = new Map();
  
  try {
    // Lấy dữ liệu ProductView (lượt xem) - Trọng số thấp
    const productViews = await prisma.productView.findMany({
      where: {
        viewCount: { gt: 0 } // Chỉ xem xét các sản phẩm đã được xem ít nhất 1 lần
      },
      include: {
        product: {
          select: { id: true, categoryId: true, price: true }
        }
      }
    });

    // Lấy dữ liệu OrderItem (mua hàng) - Trọng số cao nhất
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: "COMPLETED" // Chỉ tính các đơn hàng đã hoàn thành
        }
      },
      include: {
        order: {
          select: { userId: true }
        },
        product: {
          select: { id: true, categoryId: true, price: true }
        }
      }
    });

    // Lấy dữ liệu Review (đánh giá) - Trọng số cao
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: { id: true, categoryId: true, price: true }
        }
      }
    });

    // Lấy dữ liệu RecommendationInteraction (tương tác với gợi ý)
    const interactions = await prisma.recommendationInteraction.findMany({
      include: {
        product: {
          select: { id: true, categoryId: true, price: true }
        }
      }
    });

    // Tích hợp dữ liệu lượt xem
    productViews.forEach(view => {
      if (!view.product) return;
      
      const userId = view.userId;
      const productId = view.productId;
      
      // Điểm số từ lượt xem (tối đa 3.0)
      // Trọng số: 0.2 cho mỗi lượt xem, tối đa 3.0
      const viewScore = Math.min(view.viewCount * 0.2, 3.0);
      
      // Thêm vào ma trận
      if (!matrix.has(userId)) {
        matrix.set(userId, new Map());
      }
      
      matrix.get(userId)!.set(productId, viewScore);
    });

    // Tích hợp dữ liệu mua hàng (mua hàng có trọng số cao nhất - 5.0)
    orderItems.forEach(item => {
      if (!item.product || !item.order) return;
      
      const userId = item.order.userId;
      const productId = item.productId;
      
      // Điểm cố định cho mua hàng là 5.0
      const purchaseScore = 5.0;
      
      if (!matrix.has(userId)) {
        matrix.set(userId, new Map());
      }
      
      // Mua hàng quan trọng hơn chỉ xem
      matrix.get(userId)!.set(productId, purchaseScore);
    });

    // Tích hợp dữ liệu đánh giá (đánh giá có trọng số cao, sử dụng điểm đánh giá thực tế)
    reviews.forEach(review => {
      if (!review.product) return;
      
      const userId = review.userId;
      const productId = review.productId;
      
      // Sử dụng điểm đánh giá thực tế (thang 1-5)
      const reviewScore = review.rating;
      
      if (!matrix.has(userId)) {
        matrix.set(userId, new Map());
      }
      
      // Ưu tiên đánh giá từ người dùng
      matrix.get(userId)!.set(productId, reviewScore);
    });

    // Tích hợp dữ liệu tương tác với gợi ý
    interactions.forEach(interaction => {
      if (!interaction.product) return;
      
      const userId = interaction.userId;
      const productId = interaction.productId;
      
      // Điểm số dựa trên loại tương tác
      let interactionScore = 0;
      
      switch (interaction.interactionType) {
        case 'view': 
          interactionScore = 2.0; 
          break;
        case 'cart': 
          interactionScore = 4.0; 
          break;
        case 'purchase': 
          interactionScore = 5.0; 
          break;
        default: 
          interactionScore = 1.0;
      }
      
      if (!matrix.has(userId)) {
        matrix.set(userId, new Map());
      }
      
      const currentScore = matrix.get(userId)!.get(productId) || 0;
      
      // Lấy giá trị lớn nhất giữa điểm hiện tại và điểm tương tác
      matrix.get(userId)!.set(productId, Math.max(currentScore, interactionScore));
    });

    return matrix;
  } catch (error) {
    console.error('Lỗi khi xây dựng ma trận xếp hạng:', error);
    return new Map();
  }
}

/**
 * Tính toán độ tương đồng giữa các sản phẩm (item-item similarity)
 * Sử dụng hệ số tương quan cosine
 */
export async function calculateItemSimilarity(ratingMatrix: RatingMatrix): Promise<ItemSimilarityMatrix> {
  const similarity: ItemSimilarityMatrix = new Map();
  
  // Tạo ma trận người dùng-sản phẩm nghịch đảo (product to users)
  const productUsers: Map<string, Map<string, number>> = new Map();
  
  // Đối với mỗi người dùng
  ratingMatrix.forEach((userRatings, userId) => {
    // Đối với mỗi sản phẩm người dùng đã tương tác
    userRatings.forEach((rating, productId) => {
      if (!productUsers.has(productId)) {
        productUsers.set(productId, new Map());
      }
      
      productUsers.get(productId)!.set(userId, rating);
    });
  });
  
  // Danh sách tất cả các sản phẩm
  const allProducts = Array.from(productUsers.keys());
  
  // Tính toán độ tương đồng giữa từng cặp sản phẩm
  for (let i = 0; i < allProducts.length; i++) {
    const product1 = allProducts[i];
    const product1Users = productUsers.get(product1)!;
    
    if (!similarity.has(product1)) {
      similarity.set(product1, new Map());
    }
    
    for (let j = 0; j < allProducts.length; j++) {
      const product2 = allProducts[j];
      
      // Bỏ qua nếu là cùng một sản phẩm
      if (product1 === product2) {
        similarity.get(product1)!.set(product2, 1.0);
        continue;
      }
      
      const product2Users = productUsers.get(product2)!;
      
      // Tìm người dùng đã tương tác với cả hai sản phẩm
      const commonUsers = new Set(
        [...product1Users.keys()].filter(userId => product2Users.has(userId))
      );
      
      // Nếu không có người dùng chung, độ tương đồng = 0
      if (commonUsers.size === 0) {
        similarity.get(product1)!.set(product2, 0);
        continue;
      }
      
      // Tính toán độ tương đồng cosine
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      commonUsers.forEach(userId => {
        const rating1 = product1Users.get(userId)!;
        const rating2 = product2Users.get(userId)!;
        
        dotProduct += rating1 * rating2;
        norm1 += rating1 * rating1;
        norm2 += rating2 * rating2;
      });
      
      const similarityValue = norm1 > 0 && norm2 > 0 ? 
        dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
      
      similarity.get(product1)!.set(product2, similarityValue);
    }
  }
  
  return similarity;
}

/**
 * Tìm kiếm sản phẩm tương tự dựa trên độ tương đồng
 * @param productId Mã sản phẩm cần tìm sản phẩm tương tự
 * @param similarityMatrix Ma trận độ tương đồng giữa các sản phẩm
 * @param limit Số lượng sản phẩm tương tự cần trả về
 * @returns Danh sách ID sản phẩm tương tự
 */
export function findSimilarItems(
  productId: string, 
  similarityMatrix: ItemSimilarityMatrix, 
  limit: number = 10
): {id: string, similarity: number}[] {
  // Kiểm tra sản phẩm có trong ma trận hay không
  if (!similarityMatrix.has(productId)) {
    return [];
  }
  
  const productSimilarities = similarityMatrix.get(productId)!;
  
  // Sắp xếp các sản phẩm theo độ tương đồng giảm dần
  const sortedSimilarProducts = [...productSimilarities.entries()]
    .filter(([id, similarity]) => id !== productId) // Loại bỏ chính sản phẩm đó
    .sort((a, b) => b[1] - a[1]) // Sắp xếp theo độ tương đồng giảm dần
    .slice(0, limit) // Lấy top N sản phẩm
    .map(([id, similarity]) => ({ id, similarity }));
  
  return sortedSimilarProducts;
}

/**
 * Dự đoán điểm đánh giá của một người dùng cho một sản phẩm
 * dựa trên đánh giá của người dùng đó cho các sản phẩm tương tự
 */
export function predictRating(
  userId: string,
  productId: string,
  ratingMatrix: RatingMatrix,
  similarityMatrix: ItemSimilarityMatrix
): number {
  // Nếu người dùng đã đánh giá sản phẩm này, trả về điểm đánh giá thực tế
  if (ratingMatrix.has(userId) && ratingMatrix.get(userId)!.has(productId)) {
    return ratingMatrix.get(userId)!.get(productId)!;
  }
  
  // Nếu không có ma trận tương đồng cho sản phẩm này, không thể dự đoán
  if (!similarityMatrix.has(productId)) {
    return 0;
  }
  
  // Nếu người dùng chưa đánh giá bất kỳ sản phẩm nào, không thể dự đoán
  if (!ratingMatrix.has(userId)) {
    return 0;
  }
  
  const userRatings = ratingMatrix.get(userId)!;
  const similarities = similarityMatrix.get(productId)!;
  
  let weightedSum = 0;
  let similaritySum = 0;
  
  // Tính tổng đánh giá có trọng số
  for (const [ratedProductId, rating] of userRatings.entries()) {
    // Bỏ qua nếu không có độ tương đồng
    if (!similarities.has(ratedProductId)) {
      continue;
    }
    
    const similarity = similarities.get(ratedProductId)!;
    
    // Chỉ xem xét các sản phẩm có độ tương đồng dương
    if (similarity > 0) {
      weightedSum += similarity * rating;
      similaritySum += similarity;
    }
  }
  
  // Nếu không có sản phẩm tương tự nào được đánh giá, không thể dự đoán
  if (similaritySum === 0) {
    return 0;
  }
  
  // Trả về dự đoán điểm đánh giá
  return weightedSum / similaritySum;
}

/**
 * Đưa ra gợi ý sản phẩm cho người dùng dựa trên collaborative filtering
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit: number = 8,
  contextData: {
    categoryId?: string,
    brandId?: string,
    priceRange?: { min: number, max: number },
    searchQuery?: string,
    currentPage?: string,
    seasonFocus?: boolean
  } = {}
): Promise<string[]> {
  try {
    // Xây dựng ma trận xếp hạng
    const ratingMatrix = await buildRatingMatrix();
    
    // Nếu là người dùng mới, không có dữ liệu đánh giá
    if (!ratingMatrix.has(userId)) {
      return []; // Trả về danh sách trống, sử dụng phương pháp khác
    }
    
    // Tính toán ma trận tương đồng
    const similarityMatrix = await calculateItemSimilarity(ratingMatrix);
    
    // Build where conditions based on context
    const whereConditions: any = { stock: { gt: 0 } };
    
    // Apply category filter if specified
    if (contextData.categoryId) {
      whereConditions.categoryId = contextData.categoryId;
    }
    
    // Apply brand filter if specified
    if (contextData.brandId) {
      whereConditions.brandId = contextData.brandId;
    }
    
    // Apply price range filter if specified
    if (contextData.priceRange) {
      whereConditions.price = {
        gte: contextData.priceRange.min,
        lte: contextData.priceRange.max
      };
    }
    
    // Lấy tất cả sản phẩm
    const allProducts = await prisma.product.findMany({
      where: whereConditions,
      select: {
        id: true
      }
    });
    
    // Lấy các sản phẩm người dùng đã tương tác
    const interactedProductIds = new Set(ratingMatrix.get(userId)!.keys());
    
    // Tính điểm dự đoán cho các sản phẩm chưa tương tác
    const predictions = allProducts
      .filter(product => !interactedProductIds.has(product.id)) // Chỉ xem xét các sản phẩm chưa tương tác
      .map(product => ({
        productId: product.id,
        score: predictRating(userId, product.id, ratingMatrix, similarityMatrix)
      }))
      .filter(prediction => prediction.score > 0) // Loại bỏ các dự đoán bằng 0
      .sort((a, b) => b.score - a.score) // Sắp xếp theo điểm giảm dần
      .slice(0, limit) // Lấy top N sản phẩm
      .map(prediction => prediction.productId);
    
    return predictions;
  } catch (error) {
    console.error('Lỗi khi lấy gợi ý collaborative filtering:', error);
    return [];
  }
}

/**
 * Lấy ma trận tương đồng và lưu vào cache để tái sử dụng
 * Cache được cập nhật mỗi 24 giờ
 */
let cachedSimilarityMatrix: ItemSimilarityMatrix | null = null;
let lastCacheUpdate: Date | null = null;

export async function getSimilarityMatrix(): Promise<ItemSimilarityMatrix> {
  // Kiểm tra xem có thể dùng cache hay không
  if (
    cachedSimilarityMatrix && 
    lastCacheUpdate && 
    (new Date().getTime() - lastCacheUpdate.getTime() < 24 * 60 * 60 * 1000)
  ) {
    return cachedSimilarityMatrix;
  }
  
  // Không có cache hoặc cache quá cũ, tính toán lại
  const ratingMatrix = await buildRatingMatrix();
  const similarityMatrix = await calculateItemSimilarity(ratingMatrix);
  
  // Cập nhật cache
  cachedSimilarityMatrix = similarityMatrix;
  lastCacheUpdate = new Date();
  
  return similarityMatrix;
} 