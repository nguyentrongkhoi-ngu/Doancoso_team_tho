import { NextRequest, NextResponse } from 'next/server';
import querystring from 'qs';
import crypto from 'crypto';
import { VNPAY_CONFIG, VNPayUtils } from '@/lib/vnpay-config';

export async function POST(req: NextRequest) {
  try {
    let vnp_Params = querystring.parse(await req.text());

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
    const vnp_TransactionNo = vnp_Params['vnp_TransactionNo']; // Mã giao dịch tại VNPAY
    const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus']; // Trạng thái giao dịch

    // TODO: Lấy thông tin đơn hàng từ database của bạn dựa trên vnp_TxnRef (orderId)
    // const order = await findOrderById(vnp_TxnRef);
    let orderFound = true; // Giả định tìm thấy đơn hàng
    let orderAmountValid = true; // Giả định số tiền khớp
    let orderStatusValid = true; // Giả định trạng thái đơn hàng ban đầu hợp lệ để cập nhật

    // TODO: Thực hiện kiểm tra thực tế:
    // if (!order) { orderFound = false; }
    // if (order.totalAmount !== vnp_Amount) { orderAmountValid = false; }
    // if (order.status === 'paid') { orderStatusValid = false; } // Ví dụ: Không cho phép cập nhật nếu đã thanh toán

    let RspCode = '99'; // Mã lỗi mặc định
    let Message = '';

    if (secureHash === signed) {
        if (orderFound) {
            if (orderAmountValid) {
                if (orderStatusValid) {
                    if (vnp_ResponseCode === '00') {
                        // TODO: Cập nhật trạng thái đơn hàng trong database thành công
                        // await updateOrderStatus(vnp_TxnRef, 'paid', vnp_TransactionNo, vnp_Amount);
                        RspCode = '00'; // Thành công
                        Message = 'Confirm Success';
                    } else {
                        // TODO: Cập nhật trạng thái đơn hàng thất bại hoặc các mã lỗi khác từ VNPay
                        // await updateOrderStatus(vnp_TxnRef, 'failed', vnp_TransactionNo, vnp_Amount, vnp_ResponseCode);
                        RspCode = '00'; // Vẫn trả về 00 nếu đã xử lý (dù là cập nhật thất bại) để VNPay ghi nhận đã nhận IPN
                        Message = 'Confirm Success - VNPay Error'; // Có thể log chi tiết hơn
                    }
                } else {
                    RspCode = '02'; // Đã cập nhật trạng thái
                    Message = 'Order already confirmed';
                }
            } else {
                RspCode = '04'; // Sai số tiền
                Message = 'Invalid Amount';
            }
        } else {
            RspCode = '01'; // Không tìm thấy đơn hàng
            Message = 'Order not found';
        }
    } else {
        RspCode = '97'; // Chữ ký không hợp lệ
        Message = 'Invalid signature';
        console.error('VNPay IPN: Invalid SecureHash');
    }

    // Trả về kết quả cho VNPay
    return NextResponse.json({ RspCode, Message });

  } catch (error: any) {
    console.error('Error processing VNPay IPN:', error);
    // Trả về lỗi hệ thống
    return NextResponse.json({ RspCode: '99', Message: 'System Error' }, { status: 500 });
  }
}

// Function moved to VNPayUtils in vnpay-config.ts