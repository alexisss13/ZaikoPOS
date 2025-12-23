import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    where: { businessId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100 // Últimos 100 eventos
  });

  return NextResponse.json(logs);
}