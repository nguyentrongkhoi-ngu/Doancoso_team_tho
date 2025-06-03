import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import crypto from 'crypto';
import querystring from 'qs';
import { VNPAY_CONFIG, VNPayUtils } from '@/lib/vnpay-config';

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, orderDescription, language = 'vn' } = await req.json();

    // Validate VNPay configuration
    const configValidation = VNPayUtils.validateConfig();
    if (!configValidation.isValid) {
      throw new Error(`VNPay configuration error: ${configValidation.errors.join(', ')}`);
    }

    // Tìm đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Kiểm tra số tiền
    if (order.total !== amount) {
      return NextResponse.json(
        { error: 'Số tiền không khớp' },
        { status: 400 }
      );
    }

    const createDate = VNPayUtils.createDate();

    const orderIdStr = orderId.toString();
    const vnp_Params: any = {
      vnp_Version: VNPAY_CONFIG.VERSION,
      vnp_Command: VNPAY_CONFIG.COMMAND,
      vnp_TmnCode: VNPAY_CONFIG.TMN_CODE,
      vnp_Locale: language || VNPAY_CONFIG.LOCALE,
      vnp_CurrCode: VNPAY_CONFIG.CURRENCY_CODE,
      vnp_TxnRef: orderIdStr,
      vnp_OrderInfo: orderDescription,
      vnp_OrderType: VNPAY_CONFIG.ORDER_TYPE,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: VNPAY_CONFIG.RETURN_URL,
      vnp_IpAddr: req.headers.get('x-forwarded-for') || '127.0.0.1',
      vnp_CreateDate: createDate
    };

    // Sắp xếp các tham số theo thứ tự alphabet
    const sortedParams = VNPayUtils.sortObject(vnp_Params);

    // Tạo chuỗi ký tự để ký
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Thêm chữ ký vào tham số
    vnp_Params.vnp_SecureHash = signed;

    // Tạo URL thanh toán
    const paymentUrl = `${VNPAY_CONFIG.PAYMENT_URL}?${querystring.stringify(vnp_Params, { encode: false })}`;

    // Lưu thông tin thanh toán
    await prisma.payment.create({
      data: {
        orderId,
        amount,
        paymentMethod: 'VNPAY',
        status: 'PENDING',
        paymentUrl
      }
    });

    return NextResponse.json({ paymentUrl });

  } catch (error: any) {
    console.error('Error creating VNPay payment URL:', error);
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi tạo URL thanh toán' },
      { status: 500 }
    );
  }
}

// Function moved to VNPayUtils in vnpay-config.ts