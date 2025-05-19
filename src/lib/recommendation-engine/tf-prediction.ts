import * as tf from '@tensorflow/tfjs';
import { UserBehaviorModel } from './user-behavior-analyzer';
import prisma from "@/lib/prisma";
import { getUserBehavior } from './user-behavior';

// Initialize TensorFlow once at module load time
let tfInitialized = false;

try {
  console.log('Initializing TensorFlow backend for prediction module...');
  tf.setBackend('cpu');
  tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
  tf.env().set('WEBGL_PACK', false);
  tfInitialized = true;
  console.log('TensorFlow backend initialized:', tf.getBackend());
} catch (e) {
  console.error('Failed to initialize TensorFlow backend:', e);
  tfInitialized = false;
}

/**
 * Safely execute a TensorFlow operation with proper error handling
 * @param operation Function containing TensorFlow operations
 * @param fallback Fallback value to return if operation fails
 */
async function safelyExecuteTF<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    if (!tfInitialized) {
      console.log('TensorFlow not initialized, using fallback');
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.error('TensorFlow operation failed:', error);
    return fallback;
  }
}

// Ensure tensors are properly disposed
function withCleanup<T>(fn: () => T, tensors: tf.Tensor[]): T {
  try {
    return fn();
  } finally {
    tensors.forEach(t => {
      if (t && !t.isDisposed) {
        t.dispose();
      }
    });
  }
}

// Đánh dấu loại mô hình
interface PredictionModel {
  model: tf.LayersModel | null;
  isReady: boolean;
  lastTrainingDate: Date | null;
}

// Khởi tạo mô hình global
let globalModel: PredictionModel = {
  model: null,
  isReady: false,
  lastTrainingDate: null
};

/**
 * Tiền xử lý dữ liệu người dùng thành tensor
 */
export function preprocessUserData(behaviorData: UserBehaviorModel): tf.Tensor {
  // Chuẩn bị dữ liệu đầu vào cho model
  
  // 1. Sở thích danh mục (lấy top 5 danh mục và chuẩn hóa điểm)
  const categoryScores = behaviorData.favoriteCategories.slice(0, 5);
  const normalizedCategoryScores = categoryScores.map(c => c.score / (categoryScores[0]?.score || 1));
  
  // Bổ sung các giá trị còn thiếu (nếu có ít hơn 5 danh mục)
  while (normalizedCategoryScores.length < 5) {
    normalizedCategoryScores.push(0);
  }
  
  // 2. Sở thích thương hiệu (lấy top 3 thương hiệu)
  const brandScores = behaviorData.brandAffinities.slice(0, 3);
  const normalizedBrandScores = brandScores.map(b => b.score / (brandScores[0]?.score || 1));
  
  // Bổ sung các giá trị còn thiếu
  while (normalizedBrandScores.length < 3) {
    normalizedBrandScores.push(0);
  }
  
  // 3. Sở thích giá cả (chuẩn hóa)
  const avgPrice = behaviorData.pricePreference.avgPrice;
  const priceRangeWidth = behaviorData.pricePreference.maxPrice - behaviorData.pricePreference.minPrice;
  const normalizedAvgPrice = avgPrice / 10000000; // Chuẩn hóa với giá trị lớn giả định
  const normalizedPriceRange = Math.min(priceRangeWidth / 5000000, 1); // Chuẩn hóa với giá trị lớn giả định
  
  // 4. Mã hóa phân khúc giá (one-hot encoding)
  const priceSegments = ['budget', 'midrange', 'premium', 'luxury'];
  const priceSegmentOneHot = priceSegments.map(segment => 
    segment === behaviorData.pricePreference.priceSegment ? 1 : 0
  );
  
  // 5. Thời gian mua sắm ưa thích
  const timeOfDay = behaviorData.viewPatterns.timeOfDay;
  const totalTimeViews = Object.values(timeOfDay).reduce((sum, count) => sum + count, 0) || 1;
  const normalizedTimeOfDay = [
    timeOfDay.morning / totalTimeViews,
    timeOfDay.afternoon / totalTimeViews,
    timeOfDay.evening / totalTimeViews,
    timeOfDay.night / totalTimeViews
  ];
  
  // 6. Mùa vụ hiện tại (one-hot encoding)
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const seasonOneHot = seasons.map(season => 
    season === behaviorData.seasonalPreferences.currentSeason ? 1 : 0
  );
  
  // 7. Thời gian xem trung bình (chuẩn hóa)
  const avgViewDuration = Math.min(behaviorData.viewPatterns.avgViewDuration / 300, 1); // Chuẩn hóa với max 5 phút
  
  // 8. Mã hóa tần suất xem (one-hot encoding)
  const viewFrequencies = ['low', 'medium', 'high'];
  const viewFrequencyOneHot = viewFrequencies.map(freq =>
    freq === behaviorData.viewPatterns.frequency ? 1 : 0
  );
  
  // 9. Thông tin về hành vi mua hàng
  // Mã hóa tần suất mua hàng (one-hot encoding)
  const purchaseFrequencies = ['rare', 'occasional', 'frequent'];
  const purchaseFrequencyOneHot = purchaseFrequencies.map(freq =>
    freq === behaviorData.purchaseBehavior.frequency ? 1 : 0
  );
  
  // Chuẩn hóa giá trị đơn hàng trung bình
  const normalizedAvgOrderValue = Math.min(behaviorData.purchaseBehavior.avgOrderValue / 5000000, 1);
  
  // Tỷ lệ bỏ giỏ hàng đã chuẩn hóa sẵn (0-1)
  const cartAbandonRate = behaviorData.purchaseBehavior.cartAbandonRate;
  
  // 10. Chỉ số thời gian (độ gần đây của tương tác)
  const now = new Date().getTime();
  const daysSinceLastView = Math.min((now - behaviorData.interactionRecency.lastView.getTime()) / (1000 * 60 * 60 * 24), 30) / 30;
  const daysSinceLastPurchase = Math.min((now - behaviorData.interactionRecency.lastPurchase.getTime()) / (1000 * 60 * 60 * 24), 90) / 90;
  
  // Kết hợp tất cả các tính năng
  const featureVector = [
    ...normalizedCategoryScores,    // 5 features
    ...normalizedBrandScores,       // 3 features mới
    normalizedAvgPrice,             // 1 feature
    normalizedPriceRange,           // 1 feature
    ...priceSegmentOneHot,          // 4 features mới
    ...normalizedTimeOfDay,         // 4 features
    ...seasonOneHot,                // 4 features
    avgViewDuration,                // 1 feature mới
    ...viewFrequencyOneHot,         // 3 features mới
    ...purchaseFrequencyOneHot,     // 3 features mới
    normalizedAvgOrderValue,        // 1 feature mới
    cartAbandonRate,                // 1 feature mới
    daysSinceLastView,              // 1 feature mới
    daysSinceLastPurchase           // 1 feature mới
  ];
  
  // Tạo tensor từ vector đặc trưng
  return tf.tensor2d([featureVector]);
}

/**
 * Tạo mô hình dự đoán nâng cao
 */
async function createModel(): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  // Thêm các lớp neural với kiến trúc phức tạp hơn
  model.add(tf.layers.dense({
    inputShape: [33], // Phù hợp với số lượng features từ preprocessUserData
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  model.add(tf.layers.dense({
    units: 32, 
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 10, // Output là xác suất cho top 10 danh mục
    activation: 'softmax'
  }));
  
  // Biên dịch mô hình với hàm mất mát mới và metrics thêm
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy', 'precision', 'recall']
  });
  
  return model;
}

/**
 * Huấn luyện mô hình với dữ liệu từ cơ sở dữ liệu
 */
export async function trainModel(): Promise<boolean> {
  try {
    // Kiểm tra xem có cần huấn luyện lại mô hình không
    // Nếu đã huấn luyện trong vòng 24 giờ, bỏ qua
    if (globalModel.lastTrainingDate && 
        (new Date().getTime() - globalModel.lastTrainingDate.getTime() < 24 * 60 * 60 * 1000)) {
      console.log('Mô hình đã được huấn luyện gần đây, bỏ qua.');
      return true;
    }
    
    console.log('Bắt đầu huấn luyện mô hình dự đoán...');
    
    // Lấy dữ liệu phân tích hành vi người dùng từ DB
    const userBehaviors = await prisma.$queryRaw`
      SELECT TOP 2000 * FROM "UserBehaviorAnalysis" 
      ORDER BY "updatedAt" DESC
    `;
    
    // Lấy dữ liệu tương tác gợi ý để sử dụng làm nhãn
    const recentInteractions = await prisma.recommendationInteraction.findMany({
      where: {
        interactionType: {
          in: ['cart', 'purchase'] // Chỉ quan tâm đến tương tác mạnh
        },
        timestamp: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 ngày gần đây
        }
      },
      include: {
        product: {
          select: {
            categoryId: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    // Kiểm tra xem có đủ dữ liệu để huấn luyện hay không
    if (!Array.isArray(userBehaviors) || userBehaviors.length < 50 || recentInteractions.length < 100) {
      console.log('Không đủ dữ liệu để huấn luyện mô hình.');
      return false;
    }
    
    // Trong môi trường thực tế, bạn sẽ cần chuyển đổi userBehaviors thành các UserBehaviorModel
    // Và tạo dữ liệu huấn luyện thích hợp
    
    // Tạo mô hình mới
    const model = await createModel();
    
    // Trong thực tế, bạn sẽ cần tạo dữ liệu huấn luyện và nhãn thực từ dữ liệu
    
    // Giả lập dữ liệu huấn luyện cho mục đích demo
    // Số lượng mẫu huấn luyện
    const sampleCount = Math.min(userBehaviors.length, 500);
    
    // Kích thước dữ liệu đầu vào và đầu ra
    const xShape = [sampleCount, 33]; // 33 features như đã định nghĩa trong preprocessUserData
    const yShape = [sampleCount, 10]; // 10 danh mục đầu ra
    
    // Tạo dữ liệu ngẫu nhiên (giả lập)
    // Trong môi trường thực tế, bạn sẽ lấy dữ liệu thực từ userBehaviors và recentInteractions
    const x_train = tf.randomNormal(xShape);
    const y_train = tf.randomUniform(yShape);
    
    // Huấn luyện mô hình với chiến lược nâng cao
    await model.fit(x_train, y_train, {
      epochs: 20, // Tăng số epochs
      batchSize: 32, // Tăng kích thước batch
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
        }
      }
    });
    
    // Lưu mô hình vào biến toàn cục
    globalModel.model = model;
    globalModel.isReady = true;
    globalModel.lastTrainingDate = new Date();
    
    console.log('Đã hoàn thành huấn luyện mô hình dự đoán.');
    
    // Giải phóng bộ nhớ
    tf.dispose([x_train, y_train]);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi huấn luyện mô hình:', error);
    return false;
  }
}

/**
 * Dự đoán danh mục sản phẩm phù hợp cho người dùng
 */
export async function predictCategoryPreferences(
  userBehavior: UserBehaviorModel,
  allCategories: { id: string; name: string }[]
): Promise<{ categoryId: string; score: number }[]> {
  // Đảm bảo mô hình đã được tải
  if (!globalModel.isReady || !globalModel.model) {
    // Thử huấn luyện mô hình nếu chưa sẵn sàng
    const trained = await trainModel();
    if (!trained || !globalModel.model) {
      console.log('Không thể tải mô hình dự đoán, sử dụng phương pháp dự phòng.');
      
      // Phương pháp dự phòng tiên tiến: kết hợp nhiều yếu tố hành vi
      // Thay vì chỉ dựa vào danh mục yêu thích, kết hợp thêm các thông tin khác
      const fallbackScores = new Map<string, number>();
      
      // 1. Điểm từ danh mục yêu thích (trọng số cao)
      userBehavior.favoriteCategories.forEach((category, index) => {
        const score = 1 - (index * 0.1); // Từ 1.0 đến 0.1
        fallbackScores.set(category.id, (fallbackScores.get(category.id) || 0) + score * 0.6);
      });
      
      // 2. Điểm theo mùa
      userBehavior.seasonalPreferences.seasonalCategories.forEach(categoryId => {
        fallbackScores.set(categoryId, (fallbackScores.get(categoryId) || 0) + 0.3);
      });
      
      // 3. Điểm theo độ mới của tương tác
      const now = new Date().getTime();
      const daysSinceLastView = (now - userBehavior.interactionRecency.lastView.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0.2, 1 - (daysSinceLastView / 30));
      
      // Kết hợp tất cả và trả về
      return Array.from(fallbackScores.entries())
        .map(([categoryId, score]) => ({
          categoryId,
          score: score * recencyFactor
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }
  }
  
  try {
    // Tiền xử lý dữ liệu người dùng
    const inputTensor = preprocessUserData(userBehavior);
    
    // Dự đoán với mô hình
    const predictions = globalModel.model.predict(inputTensor) as tf.Tensor;
    
    // Chuyển đổi kết quả tensor thành mảng JavaScript
    const scores = await predictions.array() as number[][];
    
    // Giải phóng tensor để tránh rò rỉ bộ nhớ
    tf.dispose([inputTensor, predictions]);
    
    // Map điểm số với các danh mục
    // Đảm bảo rằng số lượng danh mục phù hợp với đầu ra của mô hình
    const categoryScores = allCategories.slice(0, 10).map((category, index) => ({
      categoryId: category.id,
      score: scores[0][index] || 0 // Lấy điểm số từ dự đoán
    }));
    
    // Sắp xếp theo điểm số giảm dần
    return categoryScores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Lỗi khi dự đoán sở thích danh mục:', error);
    
    // Trả về phương pháp dự phòng nếu có lỗi
    return userBehavior.favoriteCategories.slice(0, 10);
  }
}

/**
 * Chuyển đổi dữ liệu từ DB sang UserBehaviorModel
 */
export function convertDBBehaviorToModel(record: any): UserBehaviorModel {
  // Phân tích topCategories
  const favoriteCategories = record.topCategories.split(',').map((id: string, index: number) => ({
    id,
    score: 1 - (index * 0.1) // Điểm giảm dần
  }));
  
  // Phân tích topBrands nếu có
  const brandAffinities = record.topBrands 
    ? record.topBrands.split(',').map((id: string, index: number) => ({
        brandId: id,
        score: 1 - (index * 0.1)
      }))
    : [];
  
  // Phân tích phân khúc giá từ productPreferences
  let priceSegment: 'budget' | 'midrange' | 'premium' | 'luxury' = 'midrange';
  if (record.productPreferences.includes('Phân khúc: budget')) priceSegment = 'budget';
  else if (record.productPreferences.includes('Phân khúc: premium')) priceSegment = 'premium';
  else if (record.productPreferences.includes('Phân khúc: luxury')) priceSegment = 'luxury';
  
  // Phân tích tần suất xem từ shoppingPatterns
  let viewFrequency: 'low' | 'medium' | 'high' = 'medium';
  if (record.shoppingPatterns.includes('Xem: low')) viewFrequency = 'low';
  else if (record.shoppingPatterns.includes('Xem: high')) viewFrequency = 'high';
  
  // Phân tích metrics nâng cao nếu có
  let behaviorMetrics = {};
  if (record.behaviorMetrics) {
    try {
      behaviorMetrics = JSON.parse(record.behaviorMetrics);
    } catch (e) {
      console.error('Lỗi khi phân tích behaviorMetrics:', e);
    }
  }
  
  // Tạo đối tượng UserBehaviorModel mặc định
  return {
    userId: record.userId,
    favoriteCategories,
    pricePreference: {
      minPrice: 100000,  // Giá trị mặc định
      maxPrice: 5000000, // Giá trị mặc định 
      avgPrice: 1000000, // Giá trị mặc định
      priceSegment
    },
    recentSearches: [],
    viewPatterns: {
      timeOfDay: { morning: 1, afternoon: 1, evening: 1, night: 1 },
      dayOfWeek: { monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
      avgViewDuration: (behaviorMetrics as any)?.avgViewDuration || 60,
      frequency: viewFrequency
    },
    seasonalPreferences: {
      currentSeason: getCurrentSeason(),
      seasonalCategories: (behaviorMetrics as any)?.seasonalInterests?.[getCurrentSeason()] || [],
      historicalSeasonalInterests: (behaviorMetrics as any)?.seasonalInterests || {
        spring: [], summer: [], autumn: [], winter: []
      }
    },
    brandAffinities,
    interactionRecency: {
      lastView: new Date(record.updatedAt),
      lastSearch: new Date(record.updatedAt),
      lastPurchase: new Date(record.updatedAt)
    },
    purchaseBehavior: {
      frequency: 'occasional',
      avgOrderValue: (behaviorMetrics as any)?.avgOrderValue || 1000000,
      preferredPaymentMethod: '',
      cartAbandonRate: (behaviorMetrics as any)?.cartAbandonRate || 0.5
    },
    lastActive: new Date(record.updatedAt)
  };
}

/**
 * Lấy sản phẩm được gợi ý dựa trên dự đoán danh mục
 */
export async function getSmartRecommendations(
  userId: string,
  limit: number = 8,
  contextData: {
    categoryId?: string,
    priceRange?: { min: number, max: number },
    searchQuery?: string,
    currentPage?: string,
    seasonFocus?: boolean
  } = {}
): Promise<any[]> {
  try {
    console.log(`Getting smart recommendations for user ${userId} with context:`, contextData);
    
    // Initialize default priceRange if not provided
    if (!contextData.priceRange) {
      contextData.priceRange = { min: 0, max: 1000000 };
    }
    
    // Get user behavior data
    let userBehaviorRecord = null;
    try {
      userBehaviorRecord = await prisma.userBehaviorAnalysis.findFirst({
        where: { userId }
      });
      
      console.log(`User behavior record found:`, !!userBehaviorRecord);
    } catch (dbError) {
      console.error('Error fetching user behavior analysis:', dbError);
    }
    
    // If no user behavior data, fall back to popular products with context filtering
    if (!userBehaviorRecord) {
      console.log('No user behavior data, using popular products with context filtering');
      return getPopularProductsWithContext(limit, contextData);
    }
    
    // Parse user behavior data
    let topCategories: string[] = [];
    
    try {
      if (userBehaviorRecord.topCategories) {
        topCategories = userBehaviorRecord.topCategories.split(',');
      }
    } catch (parseError) {
      console.error('Error parsing user behavior data:', parseError);
    }
    
    // Determine price range from behavior or context
    let minPrice = contextData.priceRange?.min || 0;
    let maxPrice = contextData.priceRange?.max || 1000000;
    
    if (!contextData.priceRange && userBehaviorRecord.pricePreference) {
      if (userBehaviorRecord.pricePreference.segment === 'budget') {
        minPrice = 0;
        maxPrice = userBehaviorRecord.pricePreference.threshold || 100000;
      } else if (userBehaviorRecord.pricePreference.segment === 'midrange') {
        minPrice = userBehaviorRecord.pricePreference.min || 100000;
        maxPrice = userBehaviorRecord.pricePreference.max || 500000;
      } else if (userBehaviorRecord.pricePreference.segment === 'premium') {
        minPrice = userBehaviorRecord.pricePreference.threshold || 500000;
        maxPrice = 10000000;
      }
    }
    
    // Get category ID from context or user behavior
    let topCategoryId = contextData.categoryId || (topCategories.length > 0 ? topCategories[0] : null);
    
    // Build product query with conditions
    const whereConditions: any = {
      stock: { gt: 0 } // Only in-stock products
    };
    
    // Apply price range filter
    whereConditions.price = {
      gte: minPrice,
      lte: maxPrice
    };
    
    // Apply category filter if specified
    if (topCategoryId) {
      whereConditions.categoryId = topCategoryId;
    }
    
    // Get matching products
    const products = await prisma.product.findMany({
      where: whereConditions,
      orderBy: [
        { isFeatured: 'desc' }
      ],
      take: limit * 2 // Get more products for better variety
    });
    
    if (products.length === 0) {
      console.log('No products match the criteria, using fallback');
      return getPopularProductsWithContext(limit, contextData);
    }
    
    // Get user recent view history
    const recentViews = await prisma.productView.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    
    // Function to predict user interest using TensorFlow
    const predictUserInterest = async () => {
      return await safelyExecuteTF(async () => {
        // Create a feature vector for each product
        const productFeatures: number[][] = [];
        const productIds: string[] = [];
        
        for (const product of products) {
          // Create a basic feature vector
          const categoryId = parseInt(product.categoryId.replace('category_', '')) || 0;
          const price = product.price;
          const isNew = product.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 1 : 0;
          const isFeatured = product.isFeatured ? 1 : 0;
          const viewCount = product.viewCount || 0;
          
          // Add to arrays
          productFeatures.push([categoryId, price, isNew, isFeatured, viewCount]);
          productIds.push(product.id);
        }
        
        // Create a tensor for the features
        const featureTensor = tf.tensor2d(productFeatures);
        
        // Calculate mean and standard deviation for normalization
        const mean = featureTensor.mean(0);
        const std = featureTensor.std(0);
        
        // Normalize features
        const normalizedFeatures = featureTensor.sub(mean).div(std.add(tf.scalar(1e-6)));
        
        // Create a preference vector based on user behavior
        const userPreference = tf.tensor1d([
          topCategories.length > 0 ? parseInt(topCategories[0].replace('category_', '')) || 0 : 0,
          0, // price preference - could be derived from behavior
          0, // isNew preference - could be derived from behavior
          0, // isFeatured preference - could be derived from behavior
          0  // viewCount preference - not used for user vector
        ]);
        
        // Normalize user preference vector
        const normalizedPreference = userPreference.sub(mean).div(std.add(tf.scalar(1e-6)));
        
        // Compute similarity scores
        const similarities = tf.matMul(
          normalizedFeatures, 
          normalizedPreference.reshape([5, 1])
        ).squeeze();
        
        // Get scores as array
        const scores = await similarities.array();
        
        // Cleanup tensors
        tf.dispose([featureTensor, mean, std, normalizedFeatures, userPreference, normalizedPreference, similarities]);
        
        // Create product score pairs
        const productScores = productIds.map((id, idx) => ({
          id,
          score: scores[idx]
        }));
        
        // Sort by score (highest first)
        return productScores.sort((a, b) => b.score - a.score);
      }, []);
    };
    
    // Get scored products (empty array as fallback)
    const scoredProducts = await predictUserInterest() || [];
    
    // If no scores were produced, fall back to sorted products
    if (scoredProducts.length === 0) {
      console.log('No scored products, using sorted products');
      return products.slice(0, limit);
    }
    
    // Get top products
    const topProductIds = scoredProducts.slice(0, limit).map(p => p.id);
    
    // Get full product details for recommended products
    const recommendedProducts = await prisma.product.findMany({
      where: {
        id: { in: topProductIds }
      },
      include: {
        category: true,
        images: true
      },
      take: limit
    });
    
    // Log recommendation event for performance analysis
    try {
      await prisma.recommendationLog.create({
        data: {
          userId,
          recommendationType: 'tensorflow',
          productCount: recommendedProducts.length,
          categoryIds: recommendedProducts.map(p => p.categoryId).join(','),
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Error logging recommendation:', logError);
    }
    
    return recommendedProducts;
  } catch (error) {
    console.error('Error in smart recommendations:', error);
    // Return popular products as fallback
    return getPopularProductsWithContext(limit, contextData);
  }
}

/**
 * Get popular products with context filtering
 */
async function getPopularProductsWithContext(
  limit: number = 8,
  contextData: {
    categoryId?: string,
    priceRange?: { min: number, max: number },
    searchQuery?: string,
    currentPage?: string,
    seasonFocus?: boolean
  } = {}
): Promise<any[]> {
  try {
    const whereConditions: any = {
      stock: { gt: 0 }
    };
    
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
    
    // Get popular products matching conditions
    const popularProducts = await prisma.product.findMany({
      where: whereConditions,
      orderBy: [
        { isFeatured: 'desc' }
      ],
      include: {
        category: true,
        images: true
      },
      take: limit
    });
    
    return popularProducts;
  } catch (error) {
    console.error('Error getting popular products with context:', error);
    
    // Ultimate fallback - get any products
    try {
      return await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        take: limit,
        include: {
          category: true,
          images: true
        }
      });
    } catch (fallbackError) {
      console.error('Critical error getting fallback products:', fallbackError);
      return [];
    }
  }
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