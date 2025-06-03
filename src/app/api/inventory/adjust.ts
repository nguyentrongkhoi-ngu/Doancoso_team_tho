import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/db';

// POST /api/inventory/adjust
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { productId, change, reason } = await req.json();
  if (!productId || typeof change !== 'number') {
    return NextResponse.json({ error: 'Missing productId or change' }, { status: 400 });
  }
  if (change === 0) {
    return NextResponse.json({ error: 'Số lượng thay đổi phải khác 0' }, { status: 400 });
  }
  // Cập nhật kho
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  const newStock = product.stock + change;
  if (newStock < 0) {
    return NextResponse.json({ error: 'Not enough stock' }, { status: 400 });
  }
  await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
  await prisma.inventoryHistory.create({
    data: {
      productId,
      change,
      reason,
      userId: session.user.id,
    },
  });
  return NextResponse.json({ success: true, newStock });
}
