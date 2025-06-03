/**
 * VNPay Configuration for Sandbox Environment
 * Cấu hình VNPay cho môi trường Sandbox
 */

export const VNPAY_CONFIG = {
  // Thông tin merchant từ VNPay Sandbox
  TMN_CODE: process.env.VNPAY_SANDBOX_TMN_CODE || '1BB9SZY8',
  HASH_SECRET: process.env.VNPAY_SANDBOX_HASH_SECRET || 'SCZQJGDU1L7JSWQCNGF8Q0AMZBFPJ3VK',
  
  // URLs
  PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/result',
  IPN_URL: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/vnpay/vnpay-ipn',
  
  // API Version và Command
  VERSION: '2.1.0',
  COMMAND: 'pay',
  
  // Currency và Locale
  CURRENCY_CODE: 'VND',
  LOCALE: 'vn',
  
  // Order Type
  ORDER_TYPE: 'billpayment',
  
  // Merchant Information (từ thông tin bạn cung cấp)
  MERCHANT_INFO: {
    name: 'Merchant Test',
    address: 'Sandbox Environment',
    email: 'khoinguyen.011204@gmail.com',
    website: 'https://sandbox.vnpayment.vn/merchantv2/',
    loginUrl: 'https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login'
  }
};

/**
 * Utility functions for VNPay
 */
export const VNPayUtils = {
  /**
   * Tạo createDate theo định dạng VNPay yêu cầu: yyyyMMddHHmmss
   */
  createDate(): string {
    const date = new Date();
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', '');
  },

  /**
   * Sắp xếp object theo thứ tự alphabet (yêu cầu của VNPay)
   */
  sortObject(obj: any): any {
    const sorted: any = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  },

  /**
   * Validate VNPay configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!VNPAY_CONFIG.TMN_CODE) {
      errors.push('Missing VNPAY_SANDBOX_TMN_CODE');
    }
    
    if (!VNPAY_CONFIG.HASH_SECRET) {
      errors.push('Missing VNPAY_SANDBOX_HASH_SECRET');
    }
    
    if (!VNPAY_CONFIG.RETURN_URL) {
      errors.push('Missing VNPAY_RETURN_URL');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * VNPay Response Codes và Messages
 */
export const VNPAY_RESPONSE_CODES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
  '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
  '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
  '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
  '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
  '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
  '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
  '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
};

export default VNPAY_CONFIG;
