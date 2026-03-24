import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');

  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [
      totalBusinesses,
      totalBranches,
      totalUsers,
      totalProducts,
      recentBusinesses,
      recentLogs
    ] = await Promise.all([
      prisma.business.count(),
      prisma.branch.count(),
      prisma.user.count({ 
        where: { role: { in: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER'] } } 
      }),
      prisma.product.count(),
      // Últimos 5 clientes creados
      prisma.business.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { branches: true, users: true } } }
      }),
      // Últimas 5 alertas críticas o anulaciones
      prisma.auditLog.findMany({
        where: { action: { in: ['SYSTEM_ERROR', 'DELETE_USER', 'VOID_SALE'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { name: true } },
          user: { select: { name: true } }
        }
      })
    ]);

    return NextResponse.json({
      metrics: { totalBusinesses, totalBranches, totalUsers, totalProducts },
      recentBusinesses,
      recentLogs
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al cargar métricas TI' }, { status: 500 });
  }
}