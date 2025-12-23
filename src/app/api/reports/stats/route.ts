import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date();
  
  try {
    // 1. Total Ventas Hoy
    const salesToday = await prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        status: 'COMPLETED'
      },
      _sum: { total: true },
      _count: { id: true }
    });

    // 2. Stock Bajo
    const lowStockCount = await prisma.product.count({
      where: {
        businessId,
        stock: { some: { quantity: { lte: 5 } } }
      }
    });

    // 3. Gráfico Semanal
    const last7Days = subDays(today, 7);
    const weeklySales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: last7Days },
        status: 'COMPLETED'
      },
      select: { createdAt: true, total: true }
    });

    // SOLUCIÓN DEL ERROR 'ANY':
    // Definimos explícitamente que el acumulador es un objeto { "2023-10-01": 150.00, ... }
    const chartData = weeklySales.reduce((acc: Record<string, number>, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(sale.total);
      return acc;
    }, {});

    const formattedChartData = Object.keys(chartData).map(date => ({
      name: date,
      total: chartData[date]
    })).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      today: {
        amount: Number(salesToday._sum.total || 0),
        count: salesToday._count.id
      },
      lowStock: lowStockCount,
      chart: formattedChartData
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
  }
}