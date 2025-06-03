import { NextResponse } from 'next/server';
import prisma from '@/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/inventory/history?productId=...&limit=20
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const where = productId ? { productId } : {};
  const history = await prisma.inventoryHistory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } },
  });
  return NextResponse.json(history);
}
