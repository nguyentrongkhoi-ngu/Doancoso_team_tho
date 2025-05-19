'use client';

/**
 * Client-side utilities cho việc theo dõi và ghi lại tương tác với sản phẩm được gợi ý
 * File này chỉ được thực thi ở phía client (browser)
 */

/**
 * Ghi lại tương tác với sản phẩm được gợi ý
 * @param userId ID người dùng
 * @param productId ID sản phẩm
 * @param recommendationType Loại gợi ý (vd: 'tensorflow', 'collaborative', 'content', 'matrix', 'popular', 'hybrid')
 * @param interactionType Loại tương tác ('view', 'cart', 'purchase')
 */
export async function trackRecommendationInteraction(
  userId: string,
  productId: string,
  recommendationType: string,
  interactionType: 'view' | 'cart' | 'purchase'
): Promise<boolean> {
  try {
    // Gọi API để lưu tương tác
    const response = await fetch('/api/recommendations/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId,
        recommendationType,
        interactionType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lỗi khi ghi lại tương tác:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi ghi lại tương tác:', error);
    return false;
  }
}

/**
 * Theo dõi khi người dùng nhấp vào sản phẩm được gợi ý
 * @param userId ID người dùng
 * @param productId ID sản phẩm
 * @param recommendationType Loại gợi ý
 */
export function trackRecommendationClick(
  userId: string,
  productId: string,
  recommendationType: string
) {
  // Thực hiện theo dõi không đồng bộ để không chặn UI
  trackRecommendationInteraction(userId, productId, recommendationType, 'view')
    .catch(error => console.error('Lỗi khi theo dõi click:', error));

  // Lưu thông tin vào localStorage để sử dụng sau này khi thêm vào giỏ hàng hoặc mua hàng
  try {
    const clickedRecommendations = JSON.parse(
      localStorage.getItem('clickedRecommendations') || '{}'
    );
    clickedRecommendations[productId] = {
      recommendationType,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('clickedRecommendations', JSON.stringify(clickedRecommendations));
  } catch (error) {
    console.error('Lỗi khi lưu thông tin click vào localStorage:', error);
  }
}

/**
 * Theo dõi khi người dùng thêm sản phẩm được gợi ý vào giỏ hàng
 * @param userId ID người dùng
 * @param productId ID sản phẩm
 */
export function trackRecommendationAddToCart(
  userId: string,
  productId: string
) {
  try {
    // Kiểm tra xem sản phẩm có phải là sản phẩm được gợi ý hay không
    const clickedRecommendations = JSON.parse(
      localStorage.getItem('clickedRecommendations') || '{}'
    );
    
    if (clickedRecommendations[productId]) {
      const { recommendationType } = clickedRecommendations[productId];
      
      // Ghi lại tương tác thêm vào giỏ hàng
      trackRecommendationInteraction(userId, productId, recommendationType, 'cart')
        .catch(error => console.error('Lỗi khi theo dõi thêm vào giỏ hàng:', error));
    }
  } catch (error) {
    console.error('Lỗi khi theo dõi thêm vào giỏ hàng:', error);
  }
}

/**
 * Theo dõi khi người dùng mua sản phẩm được gợi ý
 * @param userId ID người dùng
 * @param productIds Danh sách ID sản phẩm
 */
export function trackRecommendationPurchase(
  userId: string,
  productIds: string[]
) {
  try {
    // Kiểm tra xem sản phẩm có phải là sản phẩm được gợi ý hay không
    const clickedRecommendations = JSON.parse(
      localStorage.getItem('clickedRecommendations') || '{}'
    );
    
    // Theo dõi từng sản phẩm
    productIds.forEach(productId => {
      if (clickedRecommendations[productId]) {
        const { recommendationType } = clickedRecommendations[productId];
        
        // Ghi lại tương tác mua hàng
        trackRecommendationInteraction(userId, productId, recommendationType, 'purchase')
          .catch(error => console.error('Lỗi khi theo dõi mua hàng:', error));
        
        // Xóa sản phẩm khỏi danh sách đã click (vì đã mua rồi)
        delete clickedRecommendations[productId];
      }
    });
    
    // Cập nhật lại localStorage
    localStorage.setItem('clickedRecommendations', JSON.stringify(clickedRecommendations));
  } catch (error) {
    console.error('Lỗi khi theo dõi mua hàng:', error);
  }
} 