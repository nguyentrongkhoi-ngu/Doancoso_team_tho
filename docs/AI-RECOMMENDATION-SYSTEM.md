# Hệ thống Gợi ý Sản phẩm AI Nâng cao

Tài liệu này mô tả về hệ thống gợi ý sản phẩm AI nâng cao được tích hợp trong dự án Website Bán hàng E-commerce AI.

## Tổng quan

Hệ thống gợi ý sản phẩm AI sử dụng kết hợp nhiều thuật toán tiên tiến để đưa ra các gợi ý sản phẩm chính xác và phù hợp với từng người dùng. Hệ thống được thiết kế theo kiến trúc lai (hybrid) kết hợp các phương pháp:

1. **Deep Learning với TensorFlow.js**: Phân tích hành vi người dùng sâu dựa trên mạng nơ-ron
2. **Collaborative Filtering (Lọc cộng tác)**: Phân tích người dùng có hành vi tương tự
3. **Content-based Filtering (Lọc theo nội dung)**: Phân tích nội dung sản phẩm và đặc điểm
4. **Matrix Factorization (Phân tích ma trận)**: Phân tích ma trận người dùng-sản phẩm để tìm ra các yếu tố ẩn
5. **Phân tích A/B Testing**: Tự động đánh giá hiệu quả của từng thuật toán và điều chỉnh trọng số

## Kiến trúc Hệ thống

### 1. Module Phân tích Hành vi (`user-behavior-analyzer.ts`)

Module này phân tích hành vi người dùng từ nhiều nguồn dữ liệu:
- Lượt xem sản phẩm
- Lịch sử mua hàng
- Lịch sử tìm kiếm
- Thời gian người dùng tương tác

Dựa trên phân tích, module xây dựng mô hình người dùng bao gồm:
- Danh mục yêu thích (với điểm số)
- Sở thích về giá cả
- Mẫu hành vi theo thời gian (thời điểm, ngày trong tuần)
- Sở thích theo mùa
- Từ khóa tìm kiếm gần đây

### 2. Deep Learning với TensorFlow.js (`tf-prediction.ts`)

Module này triển khai mạng neural network sử dụng TensorFlow.js để dự đoán sản phẩm phù hợp:
- Sử dụng mạng neural nhiều lớp (multi-layer perceptron)
- Vector đặc trưng đầu vào gồm 15 đặc trưng của người dùng
- Đầu ra là điểm số cho các danh mục sản phẩm
- Tự động huấn luyện lại mô hình mỗi 24 giờ với dữ liệu mới

### 3. Collaborative Filtering (`collaborative-filtering.ts`)

Module này thực hiện lọc cộng tác dựa trên người dùng và sản phẩm:
- Xây dựng ma trận xếp hạng người dùng-sản phẩm
- Tính toán độ tương đồng giữa các sản phẩm sử dụng hệ số tương quan cosine
- Dự đoán xếp hạng cho các sản phẩm chưa tương tác dựa trên người dùng tương tự
- Gợi ý sản phẩm dựa trên điểm dự đoán cao nhất

### 4. Content-based Filtering (`content-based-filtering.ts`)

Module này phân tích nội dung sản phẩm để tìm ra sản phẩm tương tự:
- Xây dựng vector đặc trưng cho mỗi sản phẩm dựa trên:
  - Danh mục sản phẩm
  - Mức giá
  - Từ khóa trích xuất từ tên và mô tả
  - Các thuộc tính khác
- Tính toán độ tương đồng giữa các sản phẩm
- Đề xuất sản phẩm tương tự với sản phẩm người dùng đã tương tác

### 5. Matrix Factorization (`matrix-factorization.ts`)

Module này sử dụng kỹ thuật phân tích ma trận:
- Phân tích ma trận người dùng-sản phẩm thành ma trận đặc trưng người dùng và sản phẩm
- Học các yếu tố ẩn (latent factors) đại diện cho sở thích người dùng và đặc điểm sản phẩm
- Tối ưu hóa sử dụng thuật toán Stochastic Gradient Descent (SGD)
- Hỗ trợ giải thích cho gợi ý dựa trên phân tích

### 6. Hệ thống Gợi ý Lai (`hybrid-recommender.ts`)

Module này kết hợp tất cả các thuật toán gợi ý:
- Gọi song song tất cả thuật toán gợi ý để tăng tốc độ
- Tự động tối ưu hóa trọng số cho từng thuật toán dựa trên phân tích hiệu quả
- Tính toán điểm số tổng hợp cho mỗi sản phẩm
- Lọc các sản phẩm người dùng đã tương tác
- Trả về danh sách gợi ý cuối cùng với các thông tin chi tiết

## API Endpoints

### 1. API Gợi ý Sản phẩm

- **URL**: `/api/recommendations`
- **Method**: GET
- **Tham số**:
  - `limit`: Số lượng sản phẩm gợi ý (mặc định: 8)
  - `includeReason`: Bao gồm lý do gợi ý cho mỗi sản phẩm (mặc định: true)
  - `filterInteracted`: Lọc bỏ sản phẩm người dùng đã tương tác (mặc định: true)
  - `context`: Ngữ cảnh cho gợi ý:
    - `categoryId`: ID danh mục
    - `brandId`: ID thương hiệu
    - `searchQuery`: Truy vấn tìm kiếm
    - `currentPage`: Trang hiện tại
    - `priceRange`: Khoảng giá (`minPrice` và `maxPrice`)
    - `seasonFocus`: Tập trung vào mùa vụ hiện tại
- **Kết quả**: Danh sách sản phẩm được gợi ý, lý do gợi ý, và loại thuật toán sử dụng

### 2. API Báo cáo Hiệu suất Gợi ý

- **URL**: `/api/admin/recommendation-performance`
- **Method**: GET
- **Tham số**:
  - `period`: Khoảng thời gian báo cáo (day, week, month)
- **Kết quả**: Dữ liệu hiệu suất của các thuật toán gợi ý

### 3. API Theo dõi Tương tác Gợi ý

- **URL**: `/api/recommendations/track`
- **Method**: POST
- **Dữ liệu**:
  - `productId`: ID sản phẩm
  - `recommendationType`: Loại thuật toán gợi ý
  - `interactionType`: Loại tương tác ('view', 'cart', 'purchase')
- **Kết quả**: Xác nhận ghi nhận tương tác

## React Hooks

### Hook useSmartRecommendations

Hook React tùy chỉnh để lấy gợi ý sản phẩm từ API:
```typescript
const { 
  recommendations,   // Danh sách sản phẩm được gợi ý
  reasons,           // Lý do gợi ý cho mỗi sản phẩm
  loading,           // Trạng thái loading
  error,             // Lỗi nếu có
  recommendationType, // Loại thuật toán gợi ý
  getRecommendationTitle,    // Hàm lấy tiêu đề cho loại gợi ý
  getRecommendationDescription,  // Hàm lấy mô tả cho loại gợi ý
  logInteraction,     // Hàm ghi lại tương tác với sản phẩm
  refreshRecommendations // Hàm làm mới gợi ý
} = useSmartRecommendations({
  limit: 8,              // Số lượng sản phẩm muốn lấy
  includeReasons: true,  // Bao gồm lý do gợi ý
  filterInteracted: true,// Lọc bỏ sản phẩm đã tương tác
  context: {             // Ngữ cảnh gợi ý
    categoryId: '123',   // ID danh mục (tùy chọn)
    brandId: '456',      // ID thương hiệu (tùy chọn)
    searchQuery: 'áo',   // Truy vấn tìm kiếm (tùy chọn)
    currentPage: 'product', // Trang hiện tại (tùy chọn)
    seasonFocus: true    // Tập trung vào mùa vụ (tùy chọn)
  }
});
```

## Component Gợi ý Sản phẩm

### SmartRecommendations Component

Component React hiển thị các sản phẩm được gợi ý:
- Tự động lấy gợi ý sản phẩm từ API
- Hiển thị sản phẩm dưới dạng lưới với hình ảnh, tiêu đề, giá
- Tự động ghi lại tương tác người dùng với sản phẩm được gợi ý
- Hiển thị thông tin về loại gợi ý được sử dụng
- Xử lý trạng thái loading và lỗi một cách hợp lý

## Dashboard Báo cáo

Dashboard hiển thị báo cáo hiệu quả của hệ thống gợi ý:
- Thống kê tổng quan (lượt hiển thị, CTR, CR)
- Biểu đồ hiệu quả theo loại gợi ý
- Bảng dữ liệu chi tiết
- Báo cáo văn bản phân tích

## Cách Sử Dụng

### 1. Thêm Component Gợi ý vào Trang

```tsx
import SmartRecommendations from '@/components/SmartRecommendations';

export default function HomePage() {
  return (
    <div>
      {/* Các thành phần khác của trang */}
      <SmartRecommendations />
    </div>
  );
}
```

### 2. Ghi lại Tương tác Người dùng

```tsx
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';

export default function ProductDetailPage({ productId }) {
  const { logInteraction } = useSmartRecommendations();
  
  const handleAddToCart = () => {
    // Xử lý thêm vào giỏ hàng
    logInteraction(productId, 'cart');
  };
  
  const handlePurchase = () => {
    // Xử lý mua hàng
    logInteraction(productId, 'purchase');
  };
  
  return (
    <div>
      {/* Chi tiết sản phẩm */}
      <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
      <button onClick={handlePurchase}>Mua ngay</button>
    </div>
  );
}
```

### 3. Tùy chỉnh Thuật toán Gợi ý

```tsx
// Sử dụng chỉ TensorFlow.js
<SmartRecommendations useTensorflow={true} useHybrid={false} />

// Sử dụng chỉ hệ thống lai
<SmartRecommendations useTensorflow={false} useHybrid={true} />

// Tùy chỉnh số lượng sản phẩm
<SmartRecommendations limit={12} />
```

## Cách Mở Rộng Hệ thống

### 1. Thêm Thuật toán Gợi ý Mới

1. Tạo module mới trong thư mục `src/lib/recommendation-engine`
2. Triển khai hàm chính trả về danh sách ID sản phẩm
3. Tích hợp vào `hybrid-recommender.ts`

### 2. Điều chỉnh Trọng số Thuật toán

Chỉnh sửa `DEFAULT_WEIGHTS` trong `hybrid-recommender.ts` để điều chỉnh trọng số mặc định.

### 3. Thêm Chỉ số Hiệu quả Mới

Mở rộng `RecommendationMetrics` trong `recommendation-metrics.ts` để thêm chỉ số mới.

## Đánh giá Hiệu quả và Tối ưu hóa

Hệ thống tự động đánh giá hiệu quả qua các chỉ số:
- **Click-through Rate (CTR)**: Tỷ lệ người dùng nhấp vào sản phẩm được gợi ý
- **Conversion Rate (CR)**: Tỷ lệ người dùng mua sản phẩm được gợi ý
- **Engagement**: Mức độ tương tác của người dùng với sản phẩm được gợi ý

Tối ưu hóa thông qua:
- A/B Testing tự động để so sánh hiệu quả các phương pháp
- Điều chỉnh trọng số thuật toán dựa trên hiệu quả
- Phân tích và xử lý dữ liệu mới để cải thiện chính xác 