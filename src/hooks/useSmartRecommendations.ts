import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: {
    name: string;
  };
};

type RecommendationsResponse = {
  products: Product[];
  type: string;
  reasons?: Record<string, string>;
  error?: string;
};

interface SmartRecommendationsOptions {
  limit?: number;
  includeReasons?: boolean;
  filterInteracted?: boolean;
  context?: {
    categoryId?: string;
    searchQuery?: string;
    currentPage?: string;
    seasonFocus?: boolean;
  };
}

/**
 * Hook tùy chỉnh để lấy gợi ý sản phẩm thông minh từ API gợi ý
 * @param options - Các tùy chọn cho việc lấy gợi ý
 * @returns Trạng thái loading, kết quả gợi ý, loại gợi ý và hàm logInteraction để ghi nhận tương tác
 */
export function useSmartRecommendations(options: SmartRecommendationsOptions = {}) {
  const {
    limit = 8,
    includeReasons = true,
    filterInteracted = true,
    context = {}
  } = options;

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationType, setRecommendationType] = useState('');
  const { data: session, status } = useSession();

  // Hàm ghi lại tương tác với sản phẩm được gợi ý
  const logInteraction = async (
    productId: string, 
    interactionType: 'view' | 'cart' | 'purchase'
  ) => {
    if (!session?.user?.id || !recommendationType) return;
    
    try {
      await axios.post('/api/recommendations/track', {
        productId,
        recommendationType,
        interactionType
      });
      
      console.log(`Đã ghi lại tương tác ${interactionType} với sản phẩm ${productId}`);
    } catch (error) {
      console.error('Lỗi khi ghi lại tương tác với gợi ý:', error);
    }
  };

  const refreshRecommendations = async () => {
    // Don't attempt to load recommendations if authentication is still loading
    if (status === 'loading') {
      console.log("Authentication is still loading, deferring recommendation fetch");
      return;
    }
      
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (status !== 'authenticated' || !session?.user?.id) {
        console.log("useSmartRecommendations: User not authenticated");
        // Return popular products for non-authenticated users
        setRecommendations([]);
        setRecommendationType('popular');
        setError('Vui lòng đăng nhập để xem gợi ý phù hợp với bạn.');
        setLoading(false);
        return;
      }

      console.log("useSmartRecommendations: Starting refreshRecommendations");
      console.log("useSmartRecommendations: Session status:", status);
      console.log("useSmartRecommendations: User ID available:", !!session?.user?.id);
      
      // Create query string with new parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('includeReasons', includeReasons.toString());
      params.append('filterInteracted', filterInteracted.toString());
      
      // Add context parameters
      if (context) {
        console.log("useSmartRecommendations: Context before processing:", context);
        
        Object.entries(context).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const stringValue = String(value); // Ensure value is a string
            console.log(`useSmartRecommendations: Adding context param ${key}:`, stringValue);
            params.append(key, stringValue);
          }
        });
      }

      params.append('t', Date.now().toString()); // Add timestamp to prevent caching

      const requestUrl = `/api/recommendations?${params.toString()}`;
      console.log("useSmartRecommendations: Sending request to:", requestUrl);
      
      // Set a timeout for the request
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();
      
      // Set timeout for the request (10 seconds)
      const timeout = setTimeout(() => {
        source.cancel('Request timeout - recommendation engine taking too long');
      }, 10000);
      
      try {
        const response = await axios.get(requestUrl, {
          cancelToken: source.token,
          // Add detailed error handling
          validateStatus: function (status) {
            return status < 500; // Only resolve for non-server errors
          }
        });
        
        // Clear the timeout
        clearTimeout(timeout);
        
        console.log("useSmartRecommendations: Response received:", {
          status: response.status,
          hasData: !!response.data,
          dataType: response.data ? typeof response.data : 'undefined'
        });
        
        // Handle 401/403 errors from the response
        if (response.status === 401 || response.status === 403) {
          setError('Bạn cần đăng nhập lại để xem gợi ý sản phẩm.');
          setRecommendations([]);
          setRecommendationType('popular');
          setLoading(false);
          return;
        }
        
        const data = response.data;
        
        // Check for errors in the response data
        if (data?.error) {
          console.error(`API returned error: ${data.error}`);
          throw new Error(data.error);
        }

        // Handle response data properly based on shape
        if (Array.isArray(data)) {
          console.log(`Received ${data.length} recommendations`);
          setRecommendations(data);
          setRecommendationType(params.get('type') || 'hybrid');
        } else if (data.products && Array.isArray(data.products)) {
          console.log(`Received ${data.products.length} recommendations of type: ${data.type}`);
          setRecommendations(data.products);
          setRecommendationType(data.type);
          
          if (data.reasons) {
            setRecommendationReasons(data.reasons);
          }
        } else {
          console.error('Unexpected API response format:', data);
          throw new Error('Unexpected API response format');
        }
      } catch (err) {
        // Clear the timeout
        clearTimeout(timeout);
        
        console.error('Error fetching recommendations:', err);
        
        // Add more detailed error logging
        if (axios.isAxiosError(err)) {
          console.error('Axios error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            responseData: err.response?.data,
            requestURL: err.config?.url,
            requestMethod: err.config?.method
          });
          
          // Check for canceled request
          if (axios.isCancel(err)) {
            setError('Tải gợi ý sản phẩm bị hủy do quá thời gian chờ. Có thể hệ thống đang bận, vui lòng thử lại sau.');
          }
          // Provide more helpful error messages based on status code
          else if (err.response?.status === 401) {
            setError('Vui lòng đăng nhập để xem gợi ý sản phẩm.');
          } else if (err.response?.status === 500) {
            let errorMessage = 'Lỗi máy chủ khi tải gợi ý sản phẩm. ';
            
            // Check for TensorFlow errors
            const errorDetails = err.response?.data?.details || '';
            if (errorDetails.includes('TensorFlow') || errorDetails.includes('tensor')) {
              errorMessage += 'Lỗi xử lý mô hình AI. Hệ thống sẽ hiển thị sản phẩm phổ biến thay thế.';
            } else {
              errorMessage += 'Vui lòng thử lại sau.';
            }
            
            setError(errorMessage);
          } else {
            setError('Không thể tải gợi ý sản phẩm: ' + (err.response?.data?.error || err.message));
          }
        } else {
          setError('Không thể tải gợi ý sản phẩm: ' + (err as Error).message);
        }
        
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Unhandled exception in refreshRecommendations:', err);
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only refresh recommendations if we have a valid session or if session loading is complete
    if (status !== 'loading') {
      refreshRecommendations().catch(err => {
        // Error handling is already done inside refreshRecommendations
        console.log('Error caught by useEffect:', err);
      });
    }
  }, [session, status, limit, includeReasons, filterInteracted, JSON.stringify(context)]);

  // Mô tả loại gợi ý 
  const getRecommendationTitle = () => {
    switch (recommendationType) {
      case 'ai_personalized':
        return 'Gợi ý thông minh dành riêng cho bạn';
      case 'personalized':
        return 'Được gợi ý dựa trên sở thích của bạn';
      case 'category_based':
        return 'Sản phẩm tương tự bạn đã xem';
      case 'hybrid':
        return 'Gợi ý thông minh đa thuật toán';
      case 'collaborative':
        return 'Người dùng tương tự bạn cũng thích';
      case 'content':
        return 'Phù hợp với sở thích của bạn';
      case 'matrix':
        return 'Dự đoán bạn sẽ thích';
      case 'mixed':
        return 'Gợi ý cho bạn';
      case 'popular':
        return 'Sản phẩm phổ biến';
      case 'tensorflow':
        return 'Gợi ý bằng AI đặc biệt cho bạn';
      case 'fallback_popular':
        return 'Các sản phẩm được ưa chuộng';
      default:
        return 'Gợi ý cho bạn';
    }
  };

  // Mô tả về cách hoạt động của hệ thống gợi ý
  const getRecommendationDescription = () => {
    switch (recommendationType) {
      case 'ai_personalized':
        return 'Dựa trên phân tích trí tuệ nhân tạo về hành vi và sở thích của bạn';
      case 'personalized':
        return 'Dựa trên những sản phẩm bạn đã xem, tìm kiếm và mua';
      case 'category_based':
        return 'Các sản phẩm trong danh mục bạn thường xuyên quan tâm';
      case 'hybrid':
        return 'Kết hợp nhiều thuật toán AI để đưa ra gợi ý chính xác nhất';
      case 'collaborative':
        return 'Dựa trên hành vi của những người dùng có sở thích tương tự bạn';
      case 'content':
        return 'Phân tích nội dung sản phẩm phù hợp với sở thích của bạn';
      case 'matrix':
        return 'Sử dụng ma trận phân tích để tìm ra sản phẩm bạn có thể thích';
      case 'tensorflow':
        return 'Sử dụng mạng neural học sâu phân tích hành vi của bạn';
      case 'mixed':
        return 'Kết hợp giữa sở thích cá nhân và xu hướng chung';
      case 'popular':
        return 'Sản phẩm được nhiều người quan tâm nhất';
      case 'fallback_popular':
        return 'Các sản phẩm thịnh hành trên hệ thống';
      default:
        return '';
    }
  };

  // Trả về cả dữ liệu và các hàm tiện ích
  return {
    recommendations,
    reasons: recommendationReasons,
    loading,
    error,
    recommendationType,
    getRecommendationTitle,
    getRecommendationDescription,
    logInteraction,
    refreshRecommendations
  };
} 