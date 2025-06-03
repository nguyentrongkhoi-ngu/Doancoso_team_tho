import { NextRequest, NextResponse } from 'next/server';
import querystring from 'qs';
import crypto from 'crypto';
import { URL } from 'url';
import { VNPAY_CONFIG, VNPayUtils, VNPAY_RESPONSE_CODES } from '@/lib/vnpay-config';

export async function GET(req: NextRequest) {
  try {
    let vnp_Params = querystring.parse(req.nextUrl.search, { ignoreQueryPrefix: true });

    // Validate VNPay configuration
    const configValidation = VNPayUtils.validateConfig();
    if (!configValidation.isValid) {
      throw new Error(`VNPay configuration error: ${configValidation.errors.join(', ')}`);
    }

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_ космо']; // Remove potential extra params

    vnp_Params = VNPayUtils.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Lấy thông tin giao dịch
    const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    const vnp_TxnRef = vnp_Params['vnp_TxnRef']; // Mã tham chiếu của đơn hàng (orderId)
    const vnp_Amount = parseInt(vnp_Params['vnp_Amount'] as string) / 100; // Số tiền
    const vnp_OrderInfo = vnp_Params['vnp_OrderInfo'];
    const vnp_PayDate = vnp_Params['vnp_PayDate'];
    const vnp_TransactionNo = vnp_Params['vnp_TransactionNo']; // Mã giao dịch tại VNPAY

    let success = false;
    let message = '';

    if (secureHash === signed) {
        // Kiểm tra trạng thái giao dịch dựa trên vnp_ResponseCode
        switch (vnp_ResponseCode) {
            case '00':
                // Giao dịch thành công
                success = true;
                message = 'Giao dịch thành công!';
                // TODO: Cập nhật trạng thái đơn hàng trong database (Nên ưu tiên IPN để cập nhật trạng thái cuối cùng)
                // Ví dụ:
                // await updateOrderStatus(vnp_TxnRef, 'paid', vnp_TransactionNo, vnp_Amount);
                break;
            case '07':
                message = 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, gian lận).';
                break;
            case '09':
                message = 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.';
                break;
            case '10':
                message = 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần';
                break;
            case '11':
                message = 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.';
                break;
            case '12':
                message = 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.';
                break;
            case '13':
                message = 'Giao dịch không thành công do Sai số CVV của thẻ';
                break;
            case '24':
                message = 'Giao dịch không thành công do: Khách hàng hủy giao dịch';
                break;
            case '51':
                message = 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.';
                break;
            case '65':
                message = 'Giao dịch không thành công do: Vượt quá hạn mức thanh toán trong ngày.';
                break;
            case '75':
                message = 'Ngân hàng phát hành của thẻ đang bảo trì';
                break;
            case '79':
                message = 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định';
                break;
            case '99':
                message = 'Giao dịch lỗi từ phía VNPay hoặc hệ thống ngân hàng.';
                break;
            default:
                message = 'Giao dịch không thành công: Lỗi không xác định.';
                break;
        }
    } else {
        message = 'Chữ ký không hợp lệ!';
        // Log lỗi bảo mật
        console.error('VNPay Return URL: Invalid SecureHash');
    }

    // Chuyển hướng người dùng về trang hiển thị kết quả thanh toán
    // Bạn có thể tạo một trang riêng để hiển thị kết quả này
    const redirectUrl = new URL('/payment/result', req.nextUrl.origin);
    redirectUrl.searchParams.append('vnp_TxnRef', vnp_TxnRef as string);
    redirectUrl.searchParams.append('success', success.toString());
    redirectUrl.searchParams.append('message', message);
    // Có thể thêm các tham số khác nếu cần

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error: any) {
    console.error('Error processing VNPay return:', error);
    // Xử lý lỗi và chuyển hướng về trang báo lỗi
    const errorRedirectUrl = new URL('/payment-error', req.nextUrl.origin); // Thay /payment-error bằng route phù hợp
    errorRedirectUrl.searchParams.append('message', 'Đã xảy ra lỗi trong quá trình xử lý kết quả thanh toán.');
    return NextResponse.redirect(errorRedirectUrl.toString());
  }
}

// Function moved to VNPayUtils in vnpay-config.ts