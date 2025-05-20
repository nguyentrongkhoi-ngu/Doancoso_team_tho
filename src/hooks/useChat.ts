import { useState, useCallback, useEffect, useMemo } from 'react';
import { Message, ProductSuggestion } from '@/types/chat';
import { useCurrentProduct } from '@/context/ProductContext';
import { formatCurrency } from '@/utils/format';

// Các câu trả lời mẫu cho các câu hỏi thông thường
const PREDEFINED_RESPONSES: Record<string, string> = {
  'trạng thái đơn hàng': 'Để kiểm tra trạng thái đơn hàng, vui lòng đăng nhập vào tài khoản của bạn và truy cập mục "Đơn hàng của tôi". Hoặc bạn có thể cung cấp mã đơn hàng để chúng tôi kiểm tra giúp bạn.',
  'đơn hàng': 'Để kiểm tra trạng thái đơn hàng, vui lòng đăng nhập vào tài khoản của bạn và truy cập mục "Đơn hàng của tôi". Hoặc bạn có thể cung cấp mã đơn hàng để chúng tôi kiểm tra giúp bạn.',
  'vận chuyển': 'Chúng tôi giao hàng trong vòng 2-5 ngày làm việc đối với các khu vực nội thành và 5-7 ngày đối với các khu vực khác. Phí vận chuyển được tính dựa trên khoảng cách và trọng lượng sản phẩm.',
  'giao hàng': 'Chúng tôi giao hàng trong vòng 2-5 ngày làm việc đối với các khu vực nội thành và 5-7 ngày đối với các khu vực khác. Phí vận chuyển được tính dựa trên khoảng cách và trọng lượng sản phẩm.',
  'đổi trả': 'Chính sách đổi trả của chúng tôi cho phép khách hàng trả lại sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn và có đầy đủ bao bì.',
  'hoàn tiền': 'Chính sách đổi trả của chúng tôi cho phép khách hàng trả lại sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn và có đầy đủ bao bì. Sau khi kiểm tra sản phẩm, chúng tôi sẽ hoàn tiền trong vòng 3-5 ngày làm việc.',
  'thanh toán': 'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay, VNPay) và thanh toán khi nhận hàng (COD).',
  'phương thức thanh toán': 'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay, VNPay) và thanh toán khi nhận hàng (COD).',
  'liên hệ': 'Bạn có thể liên hệ với chúng tôi qua email support@eshop.com hoặc số điện thoại 1900-1234 trong giờ hành chính (8h-18h, Thứ 2 - Thứ 6).',
  'sản phẩm': 'Chúng tôi có nhiều danh mục sản phẩm đa dạng. Bạn có thể tìm kiếm sản phẩm theo tên hoặc duyệt qua các danh mục trên trang chủ của chúng tôi.',
  'khuyến mãi': 'Hiện tại chúng tôi đang có chương trình giảm giá 20% cho tất cả sản phẩm mới và miễn phí vận chuyển cho đơn hàng trên 500.000đ.',
  'giảm giá': 'Hiện tại chúng tôi đang có chương trình giảm giá 20% cho tất cả sản phẩm mới và miễn phí vận chuyển cho đơn hàng trên 500.000đ.',
  'tài khoản': 'Để quản lý tài khoản, vui lòng đăng nhập và truy cập vào mục "Tài khoản của tôi". Tại đây bạn có thể cập nhật thông tin cá nhân, địa chỉ giao hàng và theo dõi đơn hàng.',
  'đăng ký': 'Bạn có thể đăng ký tài khoản mới bằng cách nhấp vào nút "Đăng ký" ở góc trên bên phải của trang web. Chúng tôi chỉ yêu cầu email, tên và mật khẩu để tạo tài khoản.',
  'đăng nhập': 'Bạn có thể đăng nhập vào tài khoản bằng cách nhấp vào nút "Đăng nhập" ở góc trên bên phải của trang web và nhập email và mật khẩu của bạn.',
  'mật khẩu': 'Nếu bạn quên mật khẩu, vui lòng nhấp vào liên kết "Quên mật khẩu" trên trang đăng nhập. Chúng tôi sẽ gửi email hướng dẫn đặt lại mật khẩu cho bạn.',
  'chào': 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
  'hi': 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
  'hello': 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
  'giá': 'Giá sản phẩm của chúng tôi rất cạnh tranh và được hiển thị rõ ràng trên trang sản phẩm. Nếu bạn đang tìm kiếm một sản phẩm cụ thể, vui lòng cho biết tên sản phẩm để chúng tôi có thể hỗ trợ bạn tốt hơn.',
  'bảo hành': 'Chúng tôi cung cấp bảo hành 12 tháng cho hầu hết các sản phẩm điện tử và 6 tháng cho các phụ kiện. Thời hạn bảo hành cụ thể được ghi rõ trong thông tin sản phẩm.',
  'cảm ơn': 'Không có gì! Rất vui được hỗ trợ bạn. Nếu bạn cần thêm thông tin, đừng ngần ngại hỏi nhé!',
  'thanks': 'Không có gì! Rất vui được hỗ trợ bạn. Nếu bạn cần thêm thông tin, đừng ngần ngại hỏi nhé!',
  'so sánh sản phẩm': 'Bạn có thể so sánh các sản phẩm bằng cách thêm chúng vào danh sách so sánh. Trên mỗi trang sản phẩm, nhấp vào biểu tượng "So sánh" và sau đó truy cập vào trang So sánh để xem chi tiết.',
  'hướng dẫn mua hàng': 'Để mua hàng, bạn chỉ cần duyệt qua danh mục sản phẩm, chọn sản phẩm bạn muốn mua, thêm vào giỏ hàng và tiến hành thanh toán. Bạn có thể thanh toán bằng nhiều phương thức khác nhau như thẻ tín dụng, chuyển khoản hoặc thanh toán khi nhận hàng.',
  'tư vấn sản phẩm': 'Tôi có thể tư vấn cho bạn về các sản phẩm phù hợp với nhu cầu của bạn. Vui lòng cho tôi biết bạn đang tìm kiếm sản phẩm thuộc danh mục nào và các yêu cầu cụ thể của bạn.',
  'ưu đãi': 'Chúng tôi thường xuyên có các chương trình ưu đãi cho khách hàng. Hiện tại, chúng tôi đang có ưu đãi giảm 15% cho khách hàng mới và giảm 10% cho khách hàng thành viên khi mua sắm trong tháng này.',
  'thành viên': 'Chương trình thành viên của chúng tôi cung cấp nhiều đặc quyền như giảm giá riêng, tích điểm đổi quà, và thông báo sớm về các chương trình khuyến mãi. Đăng ký miễn phí ngay hôm nay để tận hưởng các lợi ích!',
  'điểm thưởng': 'Khách hàng thành viên sẽ được tích lũy điểm thưởng với mỗi đơn hàng. Cứ 1.000đ chi tiêu sẽ tích lũy được 1 điểm, và bạn có thể dùng điểm để đổi các voucher giảm giá hoặc quà tặng.',
  'đánh giá sản phẩm': 'Bạn có thể đánh giá sản phẩm sau khi mua hàng bằng cách đăng nhập vào tài khoản, truy cập vào mục "Đơn hàng của tôi", chọn sản phẩm đã mua và nhấp vào "Viết đánh giá".',
  'chất lượng': 'Chúng tôi cam kết cung cấp sản phẩm chất lượng cao. Tất cả sản phẩm đều được kiểm tra kỹ lưỡng trước khi giao cho khách hàng và có chính sách bảo hành rõ ràng.',
  'xuất xứ': 'Thông tin về xuất xứ của sản phẩm được ghi rõ trong phần thông tin chi tiết của mỗi sản phẩm. Chúng tôi cung cấp sản phẩm từ nhiều quốc gia và thương hiệu uy tín.',
  'phí vận chuyển': 'Phí vận chuyển được tính dựa trên khoảng cách và trọng lượng sản phẩm. Đơn hàng trên 500.000đ sẽ được miễn phí vận chuyển cho khu vực nội thành.',
  'thời gian giao hàng': 'Thời gian giao hàng thông thường là 2-5 ngày làm việc đối với khu vực nội thành và 5-7 ngày đối với các khu vực khác. Đối với sản phẩm pre-order, thời gian có thể kéo dài hơn.',
  'chính sách bảo mật': 'Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng. Thông tin của bạn sẽ chỉ được sử dụng cho mục đích xử lý đơn hàng và không được chia sẻ với bên thứ ba khi chưa có sự đồng ý.',
  'phương thức liên hệ': 'Bạn có thể liên hệ với chúng tôi qua email support@eshop.com, số điện thoại 1900-1234, chat trực tuyến trên website hoặc mạng xã hội của chúng tôi.',
  'phiếu quà tặng': 'Chúng tôi cung cấp phiếu quà tặng với nhiều mệnh giá khác nhau. Bạn có thể mua và gửi cho người thân, bạn bè như một món quà ý nghĩa.',
  'mã giảm giá': 'Mã giảm giá có thể được áp dụng trong quá trình thanh toán. Nhập mã vào ô "Mã giảm giá" và nhấp vào "Áp dụng" để hưởng ưu đãi.',
  'cửa hàng': 'Chúng tôi có cửa hàng tại nhiều thành phố lớn. Vui lòng truy cập mục "Hệ thống cửa hàng" trên website để tìm cửa hàng gần nhất.',
  'trả góp': 'Chúng tôi hỗ trợ mua hàng trả góp thông qua các đối tác tài chính như ngân hàng và công ty tài chính. Lãi suất và kỳ hạn sẽ tùy thuộc vào chính sách của đối tác.',
  'bảo hiểm sản phẩm': 'Bạn có thể mua thêm gói bảo hiểm cho sản phẩm để mở rộng thời gian bảo hành và được bảo vệ tốt hơn trước các rủi ro.',
  'quà tặng': 'Chúng tôi thường xuyên có chương trình tặng quà kèm khi mua sản phẩm. Thông tin về quà tặng sẽ được hiển thị rõ trên trang sản phẩm nếu có.',
};

// English responses for automatic language detection
const ENGLISH_RESPONSES: Record<string, string> = {
  'order status': 'To check your order status, please log in to your account and go to "My Orders" section. Alternatively, you can provide your order number for us to check it for you.',
  'shipping': 'We deliver within 2-5 business days for urban areas and 5-7 days for other locations. Shipping fees are calculated based on distance and product weight.',
  'delivery': 'We deliver within 2-5 business days for urban areas and 5-7 days for other locations. Shipping fees are calculated based on distance and product weight.',
  'return': 'Our return policy allows customers to return products within 7 days of receipt if the product is intact and has all packaging.',
  'refund': 'Our return policy allows customers to return products within 7 days of receipt if the product is intact and has all packaging. After inspecting the product, we will process your refund within 3-5 business days.',
  'payment': 'We accept payments via credit/debit cards, bank transfers, e-wallets (MoMo, ZaloPay, VNPay), and cash on delivery (COD).',
  'contact': 'You can contact us via email at support@eshop.com or call us at 1900-1234 during business hours (8am-6pm, Monday - Friday).',
  'product': 'We have a variety of product categories. You can search for products by name or browse through categories on our homepage.',
  'promotion': 'We currently have a 20% discount on all new products and free shipping for orders over 500,000 VND.',
  'discount': 'We currently have a 20% discount on all new products and free shipping for orders over 500,000 VND.',
  'account': 'To manage your account, please log in and go to "My Account" section. There you can update your personal information, delivery addresses, and track your orders.',
  'register': 'You can register a new account by clicking on the "Register" button in the top right corner of the website. We only require your email, name, and password to create an account.',
  'login': 'You can log in to your account by clicking on the "Login" button in the top right corner of the website and entering your email and password.',
  'password': 'If you forgot your password, please click on the "Forgot Password" link on the login page. We will send you an email with instructions to reset your password.',
  'hello': 'Hello! How can I help you today?',
  'hi': 'Hello! How can I help you today?',
  'price': 'Our product prices are competitive and clearly displayed on the product page. If you are looking for a specific product, please let us know the product name so we can better assist you.',
  'warranty': 'We provide a 12-month warranty for most electronic products and 6 months for accessories. Specific warranty terms are stated in the product information.',
  'thank': 'You\'re welcome! I\'m glad to be of assistance. If you need any more information, don\'t hesitate to ask!',
  'thanks': 'You\'re welcome! I\'m glad to be of assistance. If you need any more information, don\'t hesitate to ask!',
  'compare products': 'You can compare products by adding them to your comparison list. On each product page, click the "Compare" icon and then access the Compare page to view details.',
  'how to order': 'To make a purchase, simply browse through our product categories, select the product you want to buy, add it to your cart, and proceed to checkout. You can pay using various methods such as credit card, bank transfer, or cash on delivery.',
  'product recommendation': 'I can recommend products that match your needs. Please let me know what category of product you\'re looking for and your specific requirements.',
  'special offers': 'We regularly have special offers for our customers. Currently, we\'re offering a 15% discount for new customers and 10% for members when shopping this month.',
  'membership': 'Our membership program provides many privileges such as exclusive discounts, reward points for purchases, and early notifications about promotions. Register for free today to enjoy these benefits!',
  'reward points': 'Members earn reward points with each order. Every $1 spent earns 1 point, and you can use these points to redeem discount vouchers or gifts.',
  'product review': 'You can review products after purchase by logging into your account, accessing "My Orders", selecting the purchased product, and clicking "Write a Review".',
  'quality': 'We are committed to providing high-quality products. All items are thoroughly inspected before delivery to customers and come with clear warranty policies.',
  'origin': 'Information about product origin is clearly stated in the detailed information section of each product. We supply products from many reputable countries and brands.',
  'shipping fee': 'Shipping fees are calculated based on distance and product weight. Orders over $25 qualify for free shipping to urban areas.',
  'delivery time': 'Standard delivery time is 2-5 business days for urban areas and 5-7 days for other locations. For pre-order products, the time may be longer.',
  'privacy policy': 'We are committed to protecting our customers\' personal information. Your information will only be used for order processing and will not be shared with third parties without your consent.',
  'contact methods': 'You can contact us via email at support@eshop.com, phone at 1900-1234, live chat on our website, or through our social media channels.',
  'gift cards': 'We offer gift cards in various denominations. You can purchase and send them to family and friends as a meaningful gift.',
  'coupon codes': 'Discount codes can be applied during checkout. Enter the code in the "Discount Code" field and click "Apply" to enjoy the offer.',
  'stores': 'We have stores in many major cities. Please visit the "Store Locations" section on our website to find the nearest store.',
  'installment': 'We support installment purchases through financial partners such as banks and finance companies. Interest rates and terms will depend on the partner\'s policy.',
  'product insurance': 'You can purchase additional insurance coverage for your product to extend the warranty period and receive better protection against risks.',
  'gifts': 'We regularly have programs offering gifts with product purchases. Information about gifts will be clearly displayed on the product page if available.',
};

// Câu trả lời mặc định khi không tìm thấy câu trả lời phù hợp
const DEFAULT_RESPONSE = {
  vi: 'Cảm ơn bạn đã liên hệ. Hiện tại tất cả nhân viên hỗ trợ của chúng tôi đang bận. Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất. Bạn có thể để lại email hoặc số điện thoại để chúng tôi tiện liên hệ.',
  en: 'Thank you for contacting us. All our support staff are currently busy. We will get back to you as soon as possible. You can leave your email or phone number for us to contact you.'
};

// Tin nhắn chào mừng
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Xin chào! Tôi là trợ lý hỗ trợ khách hàng của E-Shop. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi về sản phẩm, đơn hàng, vận chuyển hoặc các vấn đề khác. Đừng ngần ngại đặt câu hỏi về bất kỳ chủ đề nào liên quan đến dịch vụ của chúng tôi!',
  timestamp: new Date(),
};

// Lưu trữ chat trong localStorage
const STORAGE_KEY = 'eshop_chat_messages';
const SESSION_ID_KEY = 'eshop_chat_session_id';
const MAX_CACHED_MESSAGES = 50; // Giới hạn số lượng tin nhắn được lưu trong cache

// Danh sách từ khóa liên quan đến tìm kiếm sản phẩm
const PRODUCT_SEARCH_KEYWORDS_VI = ['mua', 'sản phẩm', 'tìm', 'tìm kiếm', 'có bán', 'giá', 'bao nhiêu', 'đặt hàng'];
const PRODUCT_SEARCH_KEYWORDS_EN = ['buy', 'product', 'find', 'search', 'sell', 'price', 'how much', 'order'];

// Danh sách từ khóa liên quan đến sản phẩm hiện tại
const CURRENT_PRODUCT_KEYWORDS_VI = [
  'sản phẩm này', 'sản phẩm đang xem', 'cái này', 'món này', 'mặt hàng này', 
  'giá bao nhiêu', 'giá sản phẩm', 'còn hàng', 'mua ngay', 'đặt hàng', 'thông tin chi tiết',
  'mô tả', 'đặc điểm', 'tính năng', 'thông số'
];

const CURRENT_PRODUCT_KEYWORDS_EN = [
  'this product', 'current product', 'this item', 'this one', 
  'how much', 'price', 'in stock', 'buy now', 'order', 'details',
  'description', 'features', 'specifications', 'specs'
];

export const useChat = () => {
  // Khởi tạo state với dữ liệu từ localStorage nếu có
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Chuyển đổi timestamp từ string về Date
          return parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
          }));
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
    }
    return [WELCOME_MESSAGE];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_ID_KEY);
    }
    return null;
  });
  const [language, setLanguage] = useState<'vi' | 'en'>('vi'); // Ngôn ngữ mặc định là tiếng Việt
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);
  
  // Lấy thông tin sản phẩm hiện tại từ context
  const { currentProduct, isProductPage } = useCurrentProduct();

  // Debounced save to localStorage để tránh lưu quá nhiều lần
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const debounceSave = setTimeout(() => {
        // Chỉ lưu tối đa MAX_CACHED_MESSAGES tin nhắn mới nhất để tối ưu hiệu suất
        const messagesForStorage = messages.slice(-MAX_CACHED_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesForStorage));
      }, 300);
      
      return () => clearTimeout(debounceSave);
    }
  }, [messages]);

  // Lưu session ID vào localStorage khi có thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionId) {
        localStorage.setItem(SESSION_ID_KEY, sessionId);
      } else {
        localStorage.removeItem(SESSION_ID_KEY);
      }
    }
  }, [sessionId]);

  // Tạo phiên chat mới nếu chưa có - qua Web Worker nếu có thể
  useEffect(() => {
    if (!sessionId && messages.length > 1) {
      const createChatSession = async () => {
        try {
          const response = await fetch('/api/chat/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages,
              userName: 'Khách vãng lai', // Có thể thay đổi nếu có thông tin người dùng
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.sessionId) {
              setSessionId(data.sessionId);
            }
          }
        } catch (err) {
          console.error('Error creating chat session:', err);
        }
      };
      
      // Sử dụng requestIdleCallback nếu có để tối ưu hiệu suất
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => createChatSession());
      } else {
        // Fallback cho trình duyệt không hỗ trợ requestIdleCallback
        setTimeout(createChatSession, 300);
      }
    }
  }, [messages, sessionId]);

  // Memoize từ khóa để tìm kiếm nhanh hơn
  const vietnameseKeywords = useMemo(() => Object.keys(PREDEFINED_RESPONSES), []);
  const englishKeywords = useMemo(() => Object.keys(ENGLISH_RESPONSES), []);

  // Phát hiện ngôn ngữ từ tin nhắn
  const detectLanguage = useCallback((message: string): 'vi' | 'en' => {
    // Danh sách từ tiếng Việt đặc trưng
    const vietnameseWords = ['tôi', 'bạn', 'là', 'có', 'không', 'này', 'đó', 'và', 'hoặc', 'nhưng', 'vì', 'nếu', 'khi', 'để', 'ở'];
    const englishWords = ['i', 'you', 'is', 'are', 'have', 'this', 'that', 'and', 'or', 'but', 'because', 'if', 'when', 'for', 'in'];
    
    const lowerMessage = message.toLowerCase();
    let viCount = 0;
    let enCount = 0;
    
    // Đếm số từ tiếng Việt và tiếng Anh xuất hiện trong tin nhắn
    vietnameseWords.forEach(word => {
      if (lowerMessage.includes(` ${word} `) || lowerMessage.startsWith(`${word} `) || lowerMessage.endsWith(` ${word}`)) {
        viCount++;
      }
    });
    
    englishWords.forEach(word => {
      if (lowerMessage.includes(` ${word} `) || lowerMessage.startsWith(`${word} `) || lowerMessage.endsWith(` ${word}`)) {
        enCount++;
      }
    });
    
    // Kiểm tra các ký tự đặc trưng tiếng Việt
    if (lowerMessage.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/)) {
      viCount += 3; // Tăng trọng số cho các dấu tiếng Việt
    }
    
    return viCount >= enCount ? 'vi' : 'en';
  }, []);

  // Kiểm tra xem tin nhắn có liên quan đến sản phẩm hiện tại không
  const isCurrentProductQuery = useCallback((message: string): boolean => {
    if (!currentProduct || !isProductPage) return false;
    
    const lowerMessage = message.toLowerCase();
    const lang = detectLanguage(message);
    const keywords = lang === 'vi' ? CURRENT_PRODUCT_KEYWORDS_VI : CURRENT_PRODUCT_KEYWORDS_EN;
    
    return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  }, [currentProduct, isProductPage, detectLanguage]);

  // Tạo câu trả lời về sản phẩm hiện tại
  const generateCurrentProductResponse = useCallback((message: string): string => {
    if (!currentProduct) return '';
    
    const lang = detectLanguage(message);
    const lowerMessage = message.toLowerCase();
    
    // Định dạng giá sản phẩm
    const formattedPrice = formatCurrency(currentProduct.price, 'VND');
    
    // Kiểm tra các loại câu hỏi về sản phẩm hiện tại
    if (lang === 'vi') {
      // Câu hỏi về giá
      if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
        return `Sản phẩm ${currentProduct.name} có giá ${formattedPrice}.`;
      }
      
      // Câu hỏi về tình trạng còn hàng
      if (lowerMessage.includes('còn hàng') || lowerMessage.includes('tình trạng')) {
        return currentProduct.stock && currentProduct.stock > 0
          ? `Sản phẩm ${currentProduct.name} hiện đang còn hàng (${currentProduct.stock} sản phẩm).`
          : `Rất tiếc, sản phẩm ${currentProduct.name} hiện đã hết hàng.`;
      }
      
      // Câu hỏi về thông tin chi tiết/mô tả
      if (lowerMessage.includes('mô tả') || lowerMessage.includes('chi tiết') || 
          lowerMessage.includes('thông tin') || lowerMessage.includes('đặc điểm') || 
          lowerMessage.includes('tính năng')) {
        return currentProduct.description
          ? `Thông tin chi tiết về sản phẩm ${currentProduct.name}: ${currentProduct.description}`
          : `Sản phẩm ${currentProduct.name} có giá ${formattedPrice}. Bạn có thể xem thêm thông tin chi tiết trên trang sản phẩm.`;
      }
      
      // Câu hỏi về danh mục
      if (lowerMessage.includes('danh mục') || lowerMessage.includes('loại')) {
        return currentProduct.category
          ? `Sản phẩm ${currentProduct.name} thuộc danh mục ${currentProduct.category.name}.`
          : `Sản phẩm ${currentProduct.name} có giá ${formattedPrice}.`;
      }
      
      // Câu hỏi chung về sản phẩm
      return `Sản phẩm ${currentProduct.name} có giá ${formattedPrice}. ${
        currentProduct.description ? `Mô tả: ${currentProduct.description}. ` : ''
      }${
        currentProduct.stock !== undefined
          ? currentProduct.stock > 0
            ? `Hiện đang còn ${currentProduct.stock} sản phẩm. `
            : 'Hiện đã hết hàng. '
          : ''
      }Bạn có muốn biết thêm thông tin gì về sản phẩm này không?`;
    } else {
      // English responses
      // Price questions
      if (lowerMessage.includes('price') || lowerMessage.includes('how much')) {
        return `The price of ${currentProduct.name} is ${formattedPrice}.`;
      }
      
      // Stock questions
      if (lowerMessage.includes('stock') || lowerMessage.includes('available')) {
        return currentProduct.stock && currentProduct.stock > 0
          ? `${currentProduct.name} is currently in stock (${currentProduct.stock} items available).`
          : `Sorry, ${currentProduct.name} is currently out of stock.`;
      }
      
      // Description questions
      if (lowerMessage.includes('description') || lowerMessage.includes('details') || 
          lowerMessage.includes('information') || lowerMessage.includes('features') || 
          lowerMessage.includes('specs')) {
        return currentProduct.description
          ? `Details about ${currentProduct.name}: ${currentProduct.description}`
          : `${currentProduct.name} costs ${formattedPrice}. You can see more details on the product page.`;
      }
      
      // Category questions
      if (lowerMessage.includes('category') || lowerMessage.includes('type')) {
        return currentProduct.category
          ? `${currentProduct.name} belongs to the ${currentProduct.category.name} category.`
          : `${currentProduct.name} costs ${formattedPrice}.`;
      }
      
      // General product questions
      return `${currentProduct.name} costs ${formattedPrice}. ${
        currentProduct.description ? `Description: ${currentProduct.description}. ` : ''
      }${
        currentProduct.stock !== undefined
          ? currentProduct.stock > 0
            ? `Currently ${currentProduct.stock} items in stock. `
            : 'Currently out of stock. '
          : ''
      }Would you like to know anything else about this product?`;
    }
  }, [currentProduct, detectLanguage]);

  // Phát hiện yêu cầu tìm kiếm sản phẩm
  const detectProductSearch = useCallback(async (message: string): Promise<ProductSuggestion[]> => {
    const lowerMessage = message.toLowerCase();
    const lang = detectLanguage(message);
    const keywords = lang === 'vi' ? PRODUCT_SEARCH_KEYWORDS_VI : PRODUCT_SEARCH_KEYWORDS_EN;
    
    // Kiểm tra xem tin nhắn có chứa từ khóa tìm kiếm sản phẩm không
    const containsSearchKeyword = keywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!containsSearchKeyword) {
      return [];
    }
    
    try {
      // Gửi yêu cầu tìm kiếm sản phẩm đến API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          language: lang
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to search for products');
      }
      
      const data = await response.json();
      return data.products || [];
    } catch (err) {
      console.error('Error searching for products:', err);
      return [];
    }
  }, [detectLanguage]);

  // Hàm tìm câu trả lời phù hợp nhất cho một chuỗi từ khóa
  const findBestMatch = (keywords: string[], input: string): { keyword: string, score: number } | null => {
    const lowerInput = input.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    for (const keyword of keywords) {
      // Đơn giản: kiểm tra nếu từ khóa xuất hiện trong đầu vào
      if (lowerInput.includes(keyword.toLowerCase())) {
        // Tính điểm dựa trên độ dài từ khóa (từ khóa dài hơn được ưu tiên)
        const score = keyword.length / input.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = keyword;
        }
      }
    }
    
    return bestMatch ? { keyword: bestMatch, score: highestScore } : null;
  };

  // Phân tích câu hỏi phức tạp
  const analyzeComplexQuery = (message: string, lang: 'vi' | 'en'): string | null => {
    const keywords = lang === 'vi' ? vietnameseKeywords : englishKeywords;
    const responsesDict = lang === 'vi' ? PREDEFINED_RESPONSES : ENGLISH_RESPONSES;
    
    // Tách câu hỏi thành các phần
    const parts = message.toLowerCase().split(/[.?!,;]/);
    
    // Mảng lưu các câu trả lời tìm được
    const foundResponses: string[] = [];
    
    // Tìm câu trả lời cho từng phần
    for (const part of parts) {
      if (part.trim().length > 3) { // Chỉ xử lý các phần có ý nghĩa
        const bestMatch = findBestMatch(keywords, part);
        if (bestMatch && bestMatch.score > 0.1) { // Ngưỡng điểm tối thiểu
          foundResponses.push(responsesDict[bestMatch.keyword]);
        }
      }
    }
    
    // Kết hợp các câu trả lời tìm được
    if (foundResponses.length > 0) {
      return foundResponses.join('\n\n');
    }
    
    return null;
  };

  // Tìm câu trả lời phù hợp dựa trên từ khóa trong tin nhắn
  const findResponse = useCallback((message: string): string => {
    const lowerMessage = message.toLowerCase();
    const detectedLanguage = detectLanguage(message);
    setLanguage(detectedLanguage);
    
    // Kiểm tra xem có phải câu hỏi về sản phẩm hiện tại không
    if (isCurrentProductQuery(message)) {
      return generateCurrentProductResponse(message);
    }
    
    // Xử lý câu hỏi phức tạp
    const complexResponse = analyzeComplexQuery(message, detectedLanguage);
    
    if (complexResponse) {
      return complexResponse;
    }
    
    // Chọn từ khóa và câu trả lời dựa trên ngôn ngữ
    const keywords = detectedLanguage === 'vi' ? vietnameseKeywords : englishKeywords;
    const responses = detectedLanguage === 'vi' ? PREDEFINED_RESPONSES : ENGLISH_RESPONSES;
    
    // Tìm từ khóa phù hợp trong tin nhắn
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return responses[keyword];
      }
    }
    
    return detectedLanguage === 'vi' ? DEFAULT_RESPONSE.vi : DEFAULT_RESPONSE.en;
  }, [vietnameseKeywords, englishKeywords, detectLanguage, isCurrentProductQuery, generateCurrentProductResponse]);

  // Lưu tin nhắn trả lời từ assistant vào API
  const saveAssistantResponse = useCallback(async (content: string) => {
    if (!sessionId) return;
    
    try {
      const timestamp = new Date();
      
      // Sử dụng fetch API với signal để có thể hủy request khi cần
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 giây
      
      await fetch('/api/chat/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          response: content,
          timestamp: timestamp.toISOString(),
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('API request aborted (timeout)');
      } else {
        console.error('Error saving assistant response:', err);
      }
      // Không cần xử lý lỗi ở đây, vì không ảnh hưởng đến trải nghiệm người dùng
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Tạo tin nhắn người dùng
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      // Thêm tin nhắn người dùng vào danh sách
      setMessages(prev => [...prev, userMessage]);
      
      // Phát hiện ngôn ngữ
      const detectedLang = detectLanguage(content);
      setLanguage(detectedLang);
      
      // Xác định xem có phải là truy vấn về sản phẩm hiện tại không
      const isProductQuery = isCurrentProductQuery(content);
      
      // Xử lý câu trả lời
      let responseContent = '';
      let showProductSugg = false;
      
      if (isProductQuery && currentProduct) {
        // Tạo câu trả lời về sản phẩm hiện tại
        responseContent = generateCurrentProductResponse(content);
        showProductSugg = true;
      } else {
        // Xử lý câu hỏi phức tạp
        const complexResponse = analyzeComplexQuery(content, detectedLang);
        
        if (complexResponse) {
          responseContent = complexResponse;
        } else {
          // Tìm từ khóa phù hợp nhất
          const responsesDict = detectedLang === 'vi' ? PREDEFINED_RESPONSES : ENGLISH_RESPONSES;
          const keywords = detectedLang === 'vi' ? vietnameseKeywords : englishKeywords;
          
          const bestMatch = findBestMatch(keywords, content);
          
          if (bestMatch && bestMatch.score > 0.1) {
            responseContent = responsesDict[bestMatch.keyword];
          } else {
            // Không tìm thấy câu trả lời phù hợp, sử dụng câu trả lời mặc định
            responseContent = detectedLang === 'vi' ? DEFAULT_RESPONSE.vi : DEFAULT_RESPONSE.en;
          }
        }
      }
      
      // Tạo tin nhắn trả lời
      const botResponse: Message = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      
      // Thêm gợi ý sản phẩm nếu cần
      if (showProductSugg && currentProduct) {
        botResponse.productSuggestions = [{
          id: currentProduct.id,
          name: currentProduct.name,
          price: currentProduct.price,
          currency: 'VND',
          imageUrl: currentProduct.imageUrl || '',
          description: currentProduct.description,
          url: currentProduct.url || `/product/${currentProduct.id}`,
          inStock: currentProduct.inStock,
          discount: currentProduct.discount,
        }];
      }
      
      // Giả lập delay để tạo cảm giác chatbot đang suy nghĩ
      setTimeout(() => {
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
        
        // Lưu phiên chat nếu có session ID
        if (sessionId) {
          saveAssistantResponse(responseContent).catch(console.error);
        }
      }, 800);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  }, [currentProduct, detectLanguage, generateCurrentProductResponse, isCurrentProductQuery, sessionId, vietnameseKeywords, englishKeywords]);

  // Xóa lịch sử chat
  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
    }
    setSessionId(null);
    setLanguage('vi'); // Reset ngôn ngữ về mặc định
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearChat,
    sessionId,
    language,
    productSuggestions,
    currentProduct
  };
}; 