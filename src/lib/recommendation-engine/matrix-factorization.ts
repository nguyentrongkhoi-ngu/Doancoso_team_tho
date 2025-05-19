/**
 * Module triển khai thuật toán Matrix Factorization
 * Sử dụng phương pháp SGD (Stochastic Gradient Descent) để phân tích ma trận
 */
import * as tf from '@tensorflow/tfjs';
import prisma from "@/lib/prisma";

// Tham số cho thuật toán
const LATENT_FACTORS = 10; // Số lượng đặc trưng ẩn
const LEARNING_RATE = 0.01; // Tốc độ học
const REGULARIZATION = 0.01; // Hệ số regularization (chống overfitting)
const EPOCHS = 100; // Số vòng lặp tối đa
const BATCH_SIZE = 64; // Kích thước batch
const CONVERGENCE_THRESHOLD = 0.0001; // Ngưỡng hội tụ

// Mỗi 24 giờ huấn luyện lại mô hình một lần
const RETRAINING_INTERVAL = 24 * 60 * 60 * 1000; // 24 giờ

// Biến lưu trữ các ma trận đã phân tích
let userFactors: tf.Tensor | null = null;
let productFactors: tf.Tensor | null = null;
let userIndex: Map<string, number> = new Map();
let productIndex: Map<string, number> = new Map();
let lastTrainingTime: number = 0;

/**
 * Chuẩn bị dữ liệu cho thuật toán Matrix Factorization
 */
async function prepareData() {
  try {
    console.log('Preparing data for Matrix Factorization...');
    
    // Lấy dữ liệu về lượt xem và mua hàng
    const productViews = await prisma.productView.findMany({
      include: {
        product: true
      }
    });
    
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED'
        }
      },
      include: {
        product: true
      }
    });
    
    // Tạo mapping từ userId -> index và productId -> index
    const userIds = new Set<string>();
    const productIds = new Set<string>();
    
    // Thêm userIds và productIds từ lượt xem
    productViews.forEach(view => {
      if (view.userId) userIds.add(view.userId);
      if (view.productId) productIds.add(view.productId);
    });
    
    // Thêm userIds và productIds từ đơn hàng
    orderItems.forEach(item => {
      if (item.order.userId) userIds.add(item.order.userId);
      if (item.productId) productIds.add(item.productId);
    });
    
    // Tạo index maps
    let userIdx = 0;
    userIndex.clear();
    userIds.forEach(id => {
      userIndex.set(id, userIdx++);
    });
    
    let productIdx = 0;
    productIndex.clear();
    productIds.forEach(id => {
      productIndex.set(id, productIdx++);
    });
    
    // Tạo ma trận đánh giá, mặc định là 0
    // Lượt xem: rating = 1, Mua hàng: rating = 2
    const ratings: [number, number, number][] = []; // [userIdx, productIdx, rating]
    
    // Thêm dữ liệu từ lượt xem
    productViews.forEach(view => {
      const uIdx = userIndex.get(view.userId);
      const pIdx = productIndex.get(view.productId);
      
      if (uIdx !== undefined && pIdx !== undefined) {
        // Quy đổi viewCount thành điểm đánh giá
        let rating = Math.min(view.viewCount / 2, 5); // Tối đa 5 điểm
        ratings.push([uIdx, pIdx, rating]);
      }
    });
    
    // Thêm dữ liệu từ đơn hàng (trọng số cao hơn)
    orderItems.forEach(item => {
      const uIdx = userIndex.get(item.order.userId);
      const pIdx = productIndex.get(item.productId);
      
      if (uIdx !== undefined && pIdx !== undefined) {
        // Đặt điểm cao nhất cho hành vi mua
        ratings.push([uIdx, pIdx, 5]);
      }
    });
    
    console.log(`Prepared data: ${userIds.size} users, ${productIds.size} products, ${ratings.length} interactions`);
    
    return {
      numUsers: userIds.size,
      numProducts: productIds.size,
      ratings
    };
  } catch (error) {
    console.error('Error preparing data for Matrix Factorization:', error);
    return {
      numUsers: 0,
      numProducts: 0,
      ratings: []
    };
  }
}

/**
 * Huấn luyện mô hình Matrix Factorization
 * @returns true nếu huấn luyện thành công, false nếu thất bại
 */
export async function trainMatrixFactorizationModel(): Promise<boolean> {
  try {
    console.log('Training Matrix Factorization model...');
    
    // Kiểm tra xem có cần huấn luyện lại không
    const now = Date.now();
    if (userFactors && productFactors && now - lastTrainingTime < RETRAINING_INTERVAL) {
      console.log('Using cached Matrix Factorization model');
      return true;
    }
    
    // Chuẩn bị dữ liệu
    const { numUsers, numProducts, ratings } = await prepareData();
    
    if (numUsers === 0 || numProducts === 0 || ratings.length === 0) {
      console.log('Not enough data for Matrix Factorization');
      return false;
    }
    
    try {
      // Đảm bảo TensorFlow đã được khởi tạo
      if (!tf.getBackend()) {
        console.log('Initializing TensorFlow backend...');
        await tf.ready();
        tf.setBackend('cpu');
      }
      
      // Khởi tạo các ma trận factor ngẫu nhiên
      userFactors = tf.randomNormal([numUsers, LATENT_FACTORS]);
      productFactors = tf.randomNormal([numProducts, LATENT_FACTORS]);
      
      // Tạo tensors của ratings
      const userIndices = tf.tensor1d(ratings.map(r => r[0]), 'int32');
      const productIndices = tf.tensor1d(ratings.map(r => r[1]), 'int32');
      const ratingValues = tf.tensor1d(ratings.map(r => r[2]), 'float32');
      
      // Tạo optimizer
      const optimizer = tf.train.adam(LEARNING_RATE);
      
      // Hàm tính loss
      const computeLoss = () => {
        // Lấy ra các latent factors cho mỗi cặp user-product
        const uFactors = tf.gather(userFactors!, userIndices);
        const pFactors = tf.gather(productFactors!, productIndices);
        
        // Dự đoán rating bằng cách nhân vô hướng
        const predictions = tf.sum(tf.mul(uFactors, pFactors), 1);
        
        // Tính MSE loss
        const lossMSE = tf.mean(tf.square(tf.sub(predictions, ratingValues)));
        
        // Thêm L2 regularization
        const userL2 = tf.mul(tf.sum(tf.square(userFactors!)), REGULARIZATION);
        const productL2 = tf.mul(tf.sum(tf.square(productFactors!)), REGULARIZATION);
        const regLoss = tf.add(userL2, productL2);
        
        // Tổng loss
        const totalLoss = tf.add(lossMSE, regLoss);
        
        return totalLoss;
      };
      
      // Tối ưu hóa với SGD
      for (let i = 0; i < EPOCHS; i++) {
        const loss = optimizer.minimize(computeLoss, true);
        
        if (i % 10 === 0) {
          console.log(`Iteration ${i}, loss: ${loss.dataSync()[0]}`);
        }
        
        // Cleanup
        loss.dispose();
      }
      
      // Cleanup tensors
      userIndices.dispose();
      productIndices.dispose();
      ratingValues.dispose();
      
      lastTrainingTime = now;
      
      console.log('Matrix Factorization model trained successfully');
      return true;
    } catch (tfError) {
      console.error('TensorFlow error during model training:', tfError);
      
      // Clean up any tensors if they exist
      if (userFactors) userFactors.dispose();
      if (productFactors) productFactors.dispose();
      
      userFactors = null;
      productFactors = null;
      
      return false;
    }
  } catch (error) {
    console.error('Error training Matrix Factorization model:', error);
    return false;
  }
}

/**
 * Đưa ra gợi ý cho người dùng dựa trên Matrix Factorization
 * @param userId ID người dùng
 * @param limit Số lượng sản phẩm gợi ý
 * @returns Danh sách ID sản phẩm được gợi ý
 */
export async function getMatrixFactorizationRecommendations(
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
    // Kiểm tra xem mô hình đã được huấn luyện chưa
    if (!userFactors || !productFactors) {
      const trained = await trainMatrixFactorizationModel();
      if (!trained) {
        console.log('Không thể huấn luyện mô hình Matrix Factorization');
        return [];
      }
    }
    
    // Kiểm tra xem người dùng có trong dữ liệu huấn luyện không
    const userIdx = userIndex.get(userId);
    if (userIdx === undefined) {
      console.log(`Người dùng ${userId} không có trong dữ liệu huấn luyện`);
      return [];
    }
    
    // Create a function to safely handle tensor operations with proper cleanup
    const getPredictedRatings = (): number[] | null => {
      try {
        // Đảm bảo TensorFlow đã được khởi tạo
        if (!tf.getBackend()) {
          console.log('Initializing TensorFlow backend...');
          tf.setBackend('cpu');
        }
        
        // Lấy đặc trưng của người dùng
        const userFactor = tf.slice(userFactors!, [userIdx, 0], [1, LATENT_FACTORS]);
        
        // Tính toán điểm dự đoán cho tất cả sản phẩm
        const predictedRatings = tf.matMul(userFactor, productFactors!.transpose());
        
        // Chuyển đổi thành mảng JavaScript
        const predictions = predictedRatings.dataSync();
        
        // Cleanup
        userFactor.dispose();
        predictedRatings.dispose();
        
        return Array.from(predictions);
      } catch (tensorError) {
        console.error('TensorFlow error during prediction:', tensorError);
        return null;
      }
    };
    
    // Get predicted ratings safely
    const predictions = getPredictedRatings();
    if (!predictions) {
      console.log('Failed to compute predictions, returning empty recommendations');
      return [];
    }
    
    // Build where conditions based on context
    const whereConditions: any = { userId };
    
    // Lấy danh sách sản phẩm người dùng đã tương tác
    const interactedProducts = await prisma.productView.findMany({
      where: whereConditions,
      select: { productId: true }
    });
    
    const interactedProductIds = new Set(interactedProducts.map(view => view.productId));
    
    // Prepare filter for context-aware filtering
    const productIndexFilters = new Set<string>();
    
    // If context-based filtering needed, query the filtered products
    if (contextData.categoryId || contextData.brandId || contextData.priceRange) {
      // Build where conditions for products
      const productWhereConditions: any = { stock: { gt: 0 } };
      
      // Apply category filter if specified
      if (contextData.categoryId) {
        productWhereConditions.categoryId = contextData.categoryId;
      }
      
      // Apply brand filter if specified
      if (contextData.brandId) {
        productWhereConditions.brandId = contextData.brandId;
      }
      
      // Apply price range filter if specified
      if (contextData.priceRange) {
        productWhereConditions.price = {
          gte: contextData.priceRange.min,
          lte: contextData.priceRange.max
        };
      }
      
      // Get filtered products
      const filteredProducts = await prisma.product.findMany({
        where: productWhereConditions,
        select: { id: true }
      });
      
      // Add filtered product IDs to the filter set
      filteredProducts.forEach(p => productIndexFilters.add(p.id));
    }
    
    // Sắp xếp sản phẩm theo điểm dự đoán
    const productScores: Array<[string, number]> = [];
    
    productIndex.forEach((idx, productId) => {
      // Bỏ qua sản phẩm đã tương tác
      if (!interactedProductIds.has(productId)) {
        // If we have context filters, only include products that match the filters
        if (productIndexFilters.size === 0 || productIndexFilters.has(productId)) {
          productScores.push([productId, predictions[idx]]);
        }
      }
    });
    
    // Sắp xếp và lấy top N
    const topProducts = productScores
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);
    
    return topProducts;
  } catch (error) {
    console.error('Lỗi khi lấy gợi ý từ Matrix Factorization:', error);
    return [];
  }
}

/**
 * Tìm người dùng tương tự dựa trên các đặc trưng ẩn
 * @param userId ID người dùng
 * @param limit Số lượng người dùng tương tự cần trả về
 * @returns Danh sách ID người dùng tương tự
 */
export async function findSimilarUsers(
  userId: string,
  limit: number = 5
): Promise<Array<{ userId: string; similarity: number }>> {
  try {
    // Kiểm tra xem mô hình đã được huấn luyện chưa
    if (!userFactors) {
      const trained = await trainMatrixFactorizationModel();
      if (!trained) {
        return [];
      }
    }
    
    // Kiểm tra xem người dùng có trong dữ liệu huấn luyện không
    const userIdx = userIndex.get(userId);
    if (userIdx === undefined) {
      return [];
    }
    
    // Create a function to safely handle tensor operations with proper cleanup
    const getSimilarities = (): {values: number[], success: boolean} => {
      try {
        // Đảm bảo TensorFlow đã được khởi tạo
        if (!tf.getBackend()) {
          console.log('Initializing TensorFlow backend...');
          tf.setBackend('cpu');
        }
        
        // Lấy đặc trưng của người dùng
        const userFactor = tf.slice(userFactors!, [userIdx, 0], [1, LATENT_FACTORS]);
        
        // Tính toán độ tương đồng cosine với tất cả người dùng khác
        const similarities = tf.div(
          tf.matMul(userFactor, userFactors!.transpose()),
          tf.mul(
            tf.norm(userFactor),
            tf.norm(userFactors!, 'euclidean', 1)
          )
        );
        
        // Chuyển đổi thành mảng JavaScript
        const similarityValues = Array.from(similarities.dataSync());
        
        // Cleanup
        userFactor.dispose();
        similarities.dispose();
        
        return {values: similarityValues, success: true};
      } catch (tensorError) {
        console.error('TensorFlow error during similarity computation:', tensorError);
        return {values: [], success: false};
      }
    };
    
    // Get similarities safely
    const {values: similarityValues, success} = getSimilarities();
    if (!success) {
      return [];
    }
    
    // Sắp xếp người dùng theo độ tương đồng
    const userSimilarities: Array<{ userId: string; similarity: number }> = [];
    
    userIndex.forEach((idx, otherId) => {
      // Bỏ qua chính người dùng đó
      if (otherId !== userId) {
        userSimilarities.push({
          userId: otherId,
          similarity: similarityValues[idx]
        });
      }
    });
    
    // Sắp xếp và lấy top N
    const topSimilarUsers = userSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return topSimilarUsers;
  } catch (error) {
    console.error('Lỗi khi tìm người dùng tương tự:', error);
    return [];
  }
}

/**
 * Tạo giải thích cho sản phẩm được gợi ý từ kết quả Matrix Factorization
 * @param userId ID người dùng
 * @param productId ID sản phẩm gợi ý
 * @returns Giải thích cho gợi ý
 */
export async function explainRecommendation(
  userId: string,
  productId: string
): Promise<string> {
  try {
    // Kiểm tra trạng thái mô hình
    if (!userFactors || !productFactors) {
      return "Không có dữ liệu giải thích cho gợi ý này.";
    }
    
    // Kiểm tra xem người dùng và sản phẩm có trong dữ liệu huấn luyện không
    const userIdx = userIndex.get(userId);
    const productIdx = productIndex.get(productId);
    
    if (userIdx === undefined || productIdx === undefined) {
      return "Sản phẩm này được đề xuất dựa trên sự phổ biến chung.";
    }
    
    try {
      // Đảm bảo TensorFlow đã được khởi tạo
      if (!tf.getBackend()) {
        tf.setBackend('cpu');
      }
      
      // Lấy đặc trưng của người dùng và sản phẩm
      const userFactor = tf.slice(userFactors, [userIdx, 0], [1, LATENT_FACTORS]);
      const productFactor = tf.slice(productFactors, [productIdx, 0], [1, LATENT_FACTORS]);
      
      // Tính dự đoán đánh giá
      const prediction = tf.sum(tf.mul(userFactor, productFactor));
      const predictedRating = prediction.dataSync()[0];
      
      // Xác định các người dùng tương tự cũng thích sản phẩm này
      const similarUsers = await findSimilarUsers(userId, 3);
      
      // Cleanup
      userFactor.dispose();
      productFactor.dispose();
      prediction.dispose();
      
      if (predictedRating > 4) {
        return `Chúng tôi tin rằng bạn sẽ rất thích sản phẩm này dựa trên phân tích hành vi của bạn và những người dùng tương tự.`;
      } else if (predictedRating > 3) {
        return `Sản phẩm này được gợi ý vì phù hợp với sở thích của bạn dựa trên các tương tác trước đây.`;
      } else {
        return `Sản phẩm này có thể phù hợp với bạn dựa trên phân tích về sở thích mua sắm của bạn.`;
      }
    } catch (tensorError) {
      console.error('TensorFlow error during explanation generation:', tensorError);
      return "Sản phẩm này được đề xuất dựa trên các mẫu hình phổ biến.";
    }
  } catch (error) {
    console.error('Lỗi khi tạo giải thích cho gợi ý:', error);
    return "Không thể tạo giải thích cho gợi ý này.";
  }
} 