import { schedulePerformanceCalculation } from './recommendation-metrics';
import { trainModel } from './tf-prediction';

let isInitialized = false;

/**
 * Khởi tạo các tính năng gợi ý sản phẩm
 * Hàm này được gọi trong quá trình khởi động ứng dụng
 */
export async function initRecommendationEngine() {
  if (isInitialized) {
    return; // Tránh khởi tạo nhiều lần
  }
  
  console.log('Khởi tạo hệ thống gợi ý sản phẩm...');
  
  try {
    // Lên lịch tính toán hiệu suất
    schedulePerformanceCalculation();
    console.log('Đã lên lịch tính toán hiệu suất gợi ý');
    
    // Huấn luyện model TensorFlow nếu cần
    try {
      const trained = await trainModel();
      if (trained) {
        console.log('Đã huấn luyện model dự đoán thành công');
      } else {
        console.log('Bỏ qua huấn luyện model do không đủ dữ liệu');
      }
    } catch (error) {
      console.error('Lỗi khi huấn luyện model:', error);
    }
    
    isInitialized = true;
    console.log('Khởi tạo hệ thống gợi ý sản phẩm thành công');
  } catch (error) {
    console.error('Lỗi khi khởi tạo hệ thống gợi ý sản phẩm:', error);
  }
} 