/**
 * Module triển khai thuật toán Content-Based Filtering (Lọc theo nội dung)
 * Phân tích các đặc điểm nội dung của sản phẩm để đưa ra gợi ý
 */
import prisma from "@/lib/prisma";
import { Product } from "@prisma/client";

/**
 * Vector đặc trưng của sản phẩm
 */
type ProductFeatureVector = {
  productId: string;
  categoryId: string;
  priceRange: number; // 0-5 (phân loại theo mức giá)
  keywords: string[]; // Từ khóa trích xuất từ tên và mô tả
  features: Record<string, number>; // Các thuộc tính khác
};

/**
 * Kết quả phân tích tương đồng sản phẩm
 */
type ProductSimilarityResult = {
  productId: string;
  score: number;
};

/**
 * Các mức độ giá để phân loại
 */
const PRICE_RANGES = [
  0, // Rất thấp
  50000, // Thấp
  200000, // Trung bình thấp
  500000, // Trung bình
  1000000, // Trung bình cao
  5000000, // Cao
  Infinity // Rất cao
];

/**
 * Chuyển đổi giá thành mức độ giá (0-6)
 */
function getPriceRange(price: number): number {
  for (let i = 0; i < PRICE_RANGES.length; i++) {
    if (price <= PRICE_RANGES[i]) {
      return i;
    }
  }
  return PRICE_RANGES.length - 1;
}

/**
 * Rút trích từ khóa từ văn bản
 * @param text Văn bản cần rút trích từ khóa
 * @returns Danh sách từ khóa
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Chuyển đổi thành chữ thường và loại bỏ ký tự đặc biệt
  const normalizedText = text.toLowerCase()
    .replace(/[^\w\sÀ-ỹ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Phân tách thành các từ
  const words = normalizedText.split(' ');
  
  // Loại bỏ các từ ngừng (stop words) - ví dụ cho tiếng Việt
  const vietnameseStopWords = new Set([
    'và', 'hoặc', 'của', 'là', 'trong', 'ngoài', 'với', 'cùng', 'cho', 'từ', 
    'được', 'đến', 'tại', 'theo', 'trên', 'dưới', 'này', 'khi', 'nếu', 'nhưng', 
    'mà', 'để', 'vì', 'bởi', 'do', 'như', 'không', 'có', 'các', 'những', 'tuy',
    'thì', 'đã', 'sẽ', 'đang', 'phải', 'nên', 'cần', 'muốn', 'được', 'bị'
  ]);
  
  // Lọc các từ có ý nghĩa (độ dài >= 2 và không phải stop word)
  return words.filter(word => word.length >= 2 && !vietnameseStopWords.has(word));
}

/**
 * Tạo vector đặc trưng cho một sản phẩm
 */
function createFeatureVector(product: Product): ProductFeatureVector {
  // Trích xuất từ khóa từ tên và mô tả sản phẩm
  const nameKeywords = extractKeywords(product.name);
  const descKeywords = product.description ? extractKeywords(product.description) : [];
  
  // Kết hợp và loại bỏ trùng lặp
  const keywords = Array.from(new Set([...nameKeywords, ...descKeywords]));
  
  // Nhận diện mức giá
  const priceRange = getPriceRange(product.price);
  
  // Tạo vector đặc trưng
  return {
    productId: product.id,
    categoryId: product.categoryId,
    priceRange,
    keywords,
    features: {
      isFeatured: product.isFeatured ? 1 : 0
    }
  };
}

/**
 * Tính toán điểm tương đồng giữa hai sản phẩm dựa trên vector đặc trưng
 */
function calculateSimilarityScore(
  productA: ProductFeatureVector, 
  productB: ProductFeatureVector
): number {
  // Bộ trọng số cho từng loại đặc trưng
  const weights = {
    category: 3.0,    // Cùng danh mục rất quan trọng
    priceRange: 1.5,   // Mức giá tương tự khá quan trọng
    keywords: 2.0,     // Từ khóa chung quan trọng
    features: 1.0      // Các đặc trưng khác ít quan trọng hơn
  };
  
  let score = 0;
  let totalWeight = 0;
  
  // 1. So sánh danh mục
  if (productA.categoryId === productB.categoryId) {
    score += weights.category;
  }
  totalWeight += weights.category;
  
  // 2. So sánh mức giá
  const priceRangeDiff = Math.abs(productA.priceRange - productB.priceRange);
  const priceRangeSimilarity = 1 - (priceRangeDiff / PRICE_RANGES.length);
  score += weights.priceRange * priceRangeSimilarity;
  totalWeight += weights.priceRange;
  
  // 3. So sánh từ khóa chung
  const keywordsA = new Set(productA.keywords);
  const keywordsB = new Set(productB.keywords);
  
  const intersectionSize = [...keywordsA].filter(kw => keywordsB.has(kw)).length;
  const unionSize = new Set([...keywordsA, ...keywordsB]).size;
  
  // Sử dụng hệ số Jaccard cho độ tương đồng từ khóa
  const keywordSimilarity = unionSize > 0 ? intersectionSize / unionSize : 0;
  score += weights.keywords * keywordSimilarity;
  totalWeight += weights.keywords;
  
  // 4. So sánh các đặc trưng khác
  let featureSimilarity = 0;
  let featureCount = 0;
  
  // Tính điểm cho các đặc trưng chung
  for (const feature in productA.features) {
    if (feature in productB.features) {
      const diff = Math.abs(productA.features[feature] - productB.features[feature]);
      const maxValue = Math.max(
        Math.abs(productA.features[feature]), 
        Math.abs(productB.features[feature])
      );
      
      featureSimilarity += maxValue > 0 ? 1 - (diff / maxValue) : 1;
      featureCount++;
    }
  }
  
  // Tính điểm trung bình nếu có đặc trưng chung
  if (featureCount > 0) {
    score += weights.features * (featureSimilarity / featureCount);
    totalWeight += weights.features;
  }
  
  // Tính điểm tương đồng cuối cùng (0-1)
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Cache vector đặc trưng để tăng hiệu suất
 */
let featureCache: Record<string, ProductFeatureVector> = {};
let lastCacheUpdate: Date | null = null;

/**
 * Xây dựng vector đặc trưng cho tất cả sản phẩm và cache lại
 */
export async function buildProductFeatureVectors(): Promise<Record<string, ProductFeatureVector>> {
  try {
    // Kiểm tra cache còn hiệu lực không (cache 24 giờ)
    if (
      Object.keys(featureCache).length > 0 && 
      lastCacheUpdate && 
      (new Date().getTime() - lastCacheUpdate.getTime() < 24 * 60 * 60 * 1000)
    ) {
      return featureCache;
    }
    
    // Lấy tất cả sản phẩm
    const products = await prisma.product.findMany({
      where: {
        stock: { gt: 0 } // Chỉ xem xét sản phẩm còn hàng
      }
    });
    
    // Xây dựng vector đặc trưng cho từng sản phẩm
    const featureVectors: Record<string, ProductFeatureVector> = {};
    
    for (const product of products) {
      featureVectors[product.id] = createFeatureVector(product);
    }
    
    // Cập nhật cache
    featureCache = featureVectors;
    lastCacheUpdate = new Date();
    
    return featureVectors;
  } catch (error) {
    console.error('Lỗi khi xây dựng vector đặc trưng sản phẩm:', error);
    return {};
  }
}

/**
 * Tìm các sản phẩm tương tự dựa trên phân tích nội dung
 */
export async function findSimilarProducts(
  productId: string, 
  limit: number = 10,
  contextFilters: any = {}
): Promise<ProductSimilarityResult[]> {
  try {
    // Lấy vector đặc trưng cho tất cả sản phẩm
    const featureVectors = await buildProductFeatureVectors();
    
    // Nếu không tìm thấy sản phẩm gốc, trả về mảng rỗng
    if (!featureVectors[productId]) {
      return [];
    }
    
    const targetVector = featureVectors[productId];
    
    // Tính điểm tương đồng với tất cả sản phẩm khác
    const similarityScores = Object.values(featureVectors)
      .filter(vector => vector.productId !== productId) // Loại bỏ chính sản phẩm đó
      .filter(vector => {
        let match = true;
        for (const key in contextFilters) {
          if (key === 'categoryId' && vector.categoryId !== contextFilters.categoryId) {
            match = false;
            break;
          }
          if (key === 'brandId' && vector.brandId !== contextFilters.brandId) {
            match = false;
            break;
          }
          if (key === 'price' && (vector.priceRange < contextFilters.price.gte || vector.priceRange > contextFilters.price.lte)) {
            match = false;
            break;
          }
        }
        return match;
      })
      .map(vector => ({
        productId: vector.productId,
        score: calculateSimilarityScore(targetVector, vector)
      }))
      .sort((a, b) => b.score - a.score) // Sắp xếp theo điểm giảm dần
      .slice(0, limit); // Lấy top N
    
    return similarityScores;
  } catch (error) {
    console.error('Lỗi khi tìm sản phẩm tương tự:', error);
    return [];
  }
}

/**
 * Phân tích nội dung sản phẩm để tìm sản phẩm tương tự
 */
export async function getContentBasedRecommendations(
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
    // Tìm các sản phẩm người dùng đã tương tác gần đây
    const recentViews = await prisma.productView.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5, // Lấy 5 sản phẩm gần nhất
      select: {
        productId: true,
        viewCount: true,
      },
    });
    
    // Nếu người dùng chưa xem sản phẩm nào, không thể đưa ra gợi ý
    if (recentViews.length === 0) {
      return [];
    }
    
    // Lấy thêm thông tin về sản phẩm người dùng đã mua gần đây
    const recentPurchases = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: 'COMPLETED',
        },
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
      take: 3, // Lấy 3 sản phẩm đã mua gần nhất
      select: {
        productId: true,
      },
    });
    
    // Kết hợp các sản phẩm đã xem và đã mua, ưu tiên đã mua
    const interactedProductIds = new Set([
      ...recentPurchases.map(item => item.productId),
      ...recentViews.map(view => view.productId)
    ]);
    
    // Build where conditions based on context for similar product search
    const contextFilters: any = {};
    
    // Apply category filter if specified
    if (contextData.categoryId) {
      contextFilters.categoryId = contextData.categoryId;
    }
    
    // Apply brand filter if specified
    if (contextData.brandId) {
      contextFilters.brandId = contextData.brandId;
    }
    
    // Apply price range filter if specified
    if (contextData.priceRange) {
      contextFilters.price = {
        gte: contextData.priceRange.min,
        lte: contextData.priceRange.max
      };
    }
    
    // Tìm các sản phẩm tương tự cho mỗi sản phẩm đã tương tác
    const similarProductsMap = new Map<string, number>();
    
    for (const productId of interactedProductIds) {
      const similarProducts = await findSimilarProducts(productId, 10, contextFilters);
      
      for (const { productId: similarId, score } of similarProducts) {
        const currentScore = similarProductsMap.get(similarId) || 0;
        
        // Lưu điểm cao nhất nếu sản phẩm được gợi ý nhiều lần
        similarProductsMap.set(similarId, Math.max(currentScore, score));
      }
    }
    
    // Lọc bỏ các sản phẩm người dùng đã tương tác
    for (const productId of interactedProductIds) {
      similarProductsMap.delete(productId);
    }
    
    // Sắp xếp theo điểm tương đồng và lấy top N sản phẩm
    const recommendations = [...similarProductsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);
    
    return recommendations;
  } catch (error) {
    console.error('Lỗi khi lấy gợi ý dựa trên nội dung:', error);
    return [];
  }
} 