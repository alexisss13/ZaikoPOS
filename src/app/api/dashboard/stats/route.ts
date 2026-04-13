import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';
    const branchFilter = searchParams.get('branch') || 'ALL';

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { branch: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const isOwner = user.role === 'OWNER' || user.role === 'SUPER_ADMIN';

    // Calcular fechas según el rango
    const now = new Date();
    let startDate = new Date();
    let yesterdayStart = new Date();
    let yesterdayEnd = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        yesterdayStart.setDate(now.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        yesterdayEnd.setDate(now.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        yesterdayStart.setDate(now.getDate() - 14);
        yesterdayStart.setHours(0, 0, 0, 0);
        yesterdayEnd.setDate(now.getDate() - 7);
        yesterdayEnd.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        yesterdayStart.setDate(now.getDate() - 60);
        yesterdayStart.setHours(0, 0, 0, 0);
        yesterdayEnd.setDate(now.getDate() - 30);
        yesterdayEnd.setHours(23, 59, 59, 999);
        break;
    }

    // Construir filtro de sucursal
    const branchCondition = branchFilter !== 'ALL' 
      ? { branchId: branchFilter }
      : isOwner 
        ? {} 
        : { branchId: user.branchId || '' };

    // Obtener ventas del período actual
    const sales = await prisma.sale.findMany({
      where: {
        ...branchCondition,
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      include: {
        items: true,
        payments: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Obtener ventas del período anterior para comparación
    const previousSales = await prisma.sale.findMany({
      where: {
        ...branchCondition,
        status: 'COMPLETED',
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd }
      }
    });

    // Calcular estadísticas básicas
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalOrders = sales.length;
    const totalSales = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Comparación con período anterior
    const previousRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const previousOrders = previousSales.length;
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const ordersChange = previousOrders > 0 
      ? ((totalOrders - previousOrders) / previousOrders) * 100 
      : 0;

    // Top productos - usar nombre completo como key único
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Crear key único con nombre del producto y variante
        const fullName = item.variantName && item.variantName !== 'Estándar' 
          ? `${item.productName} - ${item.variantName}`
          : item.productName;
        
        const current = productMap.get(fullName) || { 
          name: fullName, 
          quantity: 0, 
          revenue: 0 
        };
        productMap.set(fullName, {
          name: fullName,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + Number(item.subtotal)
        });
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data], index) => ({ id: `product-${index}`, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Ventas por sucursal (solo para owner)
    let salesByBranch: any[] = [];
    if (isOwner) {
      const branchMap = new Map<string, { branchName: string; sales: number; revenue: number; orders: number }>();
      sales.forEach(sale => {
        const key = sale.branchId;
        const current = branchMap.get(key) || { 
          branchName: sale.branch.name, 
          sales: 0, 
          revenue: 0, 
          orders: 0 
        };
        const saleItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        branchMap.set(key, {
          branchName: sale.branch.name,
          sales: current.sales + saleItems,
          revenue: current.revenue + Number(sale.total),
          orders: current.orders + 1
        });
      });

      salesByBranch = Array.from(branchMap.entries())
        .map(([branchId, data]) => ({ branchId, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
    }

    // Ventas por método de pago
    const paymentMethodMap = new Map<string, number>();
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        const current = paymentMethodMap.get(payment.method) || 0;
        paymentMethodMap.set(payment.method, current + Number(payment.amount));
      });
    });

    const salesByPaymentMethod = Object.fromEntries(paymentMethodMap);

    // Productos con stock bajo
    const stockCondition = branchFilter !== 'ALL' 
      ? { branchId: branchFilter }
      : isOwner 
        ? {} 
        : { branchId: user.branchId || '' };

    const lowStockProducts = await prisma.stock.findMany({
      where: stockCondition,
      include: {
        variant: {
          include: {
            product: true
          }
        },
        branch: true
      },
      take: 20
    });

    const formattedLowStock = lowStockProducts
      .filter(stock => stock.quantity <= stock.variant.minStock)
      .slice(0, 10)
      .map((stock, index) => ({
        id: `${stock.id}-${index}`, // Usar ID único del stock + index
        name: stock.variant.product.title + (stock.variant.name !== 'Estándar' ? ` - ${stock.variant.name}` : ''),
        stock: stock.quantity,
        minStock: stock.variant.minStock,
        branchName: stock.branch.name
      }));

    // Ventas recientes
    const recentSales = sales.slice(0, 10).map(sale => ({
      id: sale.id,
      code: sale.code,
      total: Number(sale.total),
      createdAt: sale.createdAt.toISOString(),
      branchName: sale.branch.name
    }));

    return NextResponse.json({
      totalSales,
      totalRevenue,
      totalOrders,
      averageTicket,
      topProducts,
      salesByBranch,
      salesByPaymentMethod,
      lowStockProducts: formattedLowStock,
      recentSales,
      todayVsYesterday: {
        revenue: totalRevenue,
        orders: totalOrders,
        revenueChange,
        ordersChange
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
