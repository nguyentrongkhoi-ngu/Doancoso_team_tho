import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';

export async function POST(req: NextRequest) {
  try {
    const { orderId, responseCode, transactionNo, amount } = await req.json();

    if (!orderId || !responseCode) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    // Tìm đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Kiểm tra số tiền nếu có
    if (amount && order.total !== amount) {
      return NextResponse.json(
        { error: 'Số tiền không khớp' },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái thanh toán
    const paymentStatus = responseCode === '00' ? 'SUCCESS' : 'FAILED';
    const orderStatus = responseCode === '00' ? 'PAID' : 'PENDING';

    // Cập nhật payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: paymentStatus,
          transactionId: transactionNo || undefined,
          updatedAt: new Date()
        }
      });
    }

    // Cập nhật trạng thái đơn hàng
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: orderStatus,
        updatedAt: new Date()
      }
    });

    // Trả về thông báo phù hợp
    const message = responseCode === '00'
      ? 'Thanh toán thành công!'
      : 'Thanh toán thất bại. Vui lòng thử lại sau.';

    return NextResponse.json({ message });

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật trạng thái thanh toán' },
      { status: 500 }
    );
  }
}