import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const reportType = searchParams.get('type') || 'summary';

    // Construir filtros de fecha
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Construir filtros base
    const where: any = {
      ...(Object.keys(dateFilter).length > 0 && { orderDate: dateFilter })
    };

    // Filtros de negocio
    if (role !== 'SUPER_ADMIN') {
      where.businessId = businessId;
    }

    if (supplierId && supplierId !== 'all') {
      where.supplierId = supplierId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    switch (reportType) {
      case 'summary':
        return await getPurchasesSummary(where);
      case 'detailed':
        return await getDetailedPurchases(where, searchParams);
      case 'by-supplier':
        return await getPurchasesBySupplier(where);
      case 'by-product':
        return await getPurchasesByProduct(where, searchParams);
      case 'pending':
        return await getPendingPurchases(where);
      default:
        return await getPurchasesSummary(where);
    }
  } catch (error) {
    console.error('[PURCHASES_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Error al generar reporte de compras' }, { status: 500 });
  }
}

async function getPurchasesSummary(where: any) {
  const [purchases, totalOrders, totalAmount, averageOrder] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      select: {
        totalAmount: true,
        status: true,
        orderDate: true
      }
    }),
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.aggregate({
      where,
      _sum: {
        totalAmount: true
      }
    }),
    prisma.purchaseOrder.aggregate({
      where,
      _avg: {
        totalAmount: true
      }
    })
  ]);

  // Estadísticas por estado
  const statusStats = purchases.reduce((acc: any, purchase) => {
    if (!acc[purchase.status]) {
      acc[purchase.status] = { count: 0, amount: 0 };
    }
    acc[purchase.status].count += 1;
    acc[purchase.status].amount += Number(purchase.totalAmount);
    return acc;
  }, {});

  // Agrupar por mes para gráfico
  const purchasesByMonth = purchases.reduce((acc: any, purchase) => {
    const month = purchase.orderDate.toISOString().substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, orders: 0, amount: 0 };
    }
    acc[month].orders += 1;
    acc[month].amount += Number(purchase.totalAmount);
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      totalOrders,
      totalAmount: Number(totalAmount._sum.totalAmount) || 0,
      averageOrder: Number(averageOrder._avg.totalAmount) || 0,
      statusStats
    },
    chartData: Object.values(purchasesByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month))
  });
}

async function getDetailedPurchases(where: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: { name: true, ruc: true }
        },
        createdBy: {
          select: { name: true }
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { title: true }
                }
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' },
      skip,
      take: limit
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  return NextResponse.json({
    purchases: purchases.map(purchase => ({
      id: purchase.id,
      orderDate: purchase.orderDate,
      receivedDate: purchase.receivedDate,
      status: purchase.status,
      totalAmount: Number(purchase.totalAmount),
      supplier: purchase.supplier,
      createdBy: purchase.createdBy?.name || 'Sistema',
      itemsCount: purchase.items.length,
      totalItems: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
      notes: purchase.notes
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getPurchasesBySupplier(where: any) {
  const supplierPurchases = await prisma.purchaseOrder.groupBy({
    by: ['supplierId'],
    where,
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    }
  });

  const supplierIds = supplierPurchases
    .map(purchase => purchase.supplierId)
    .filter(id => id !== null) as string[];

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, name: true, ruc: true }
  });

  const supplierMap = suppliers.reduce((acc: any, supplier) => {
    acc[supplier.id] = supplier;
    return acc;
  }, {});

  return NextResponse.json({
    suppliers: supplierPurchases.map(purchase => ({
      supplierId: purchase.supplierId,
      supplier: purchase.supplierId ? supplierMap[purchase.supplierId] : { name: 'Sin proveedor', ruc: null },
      totalAmount: Number(purchase._sum.totalAmount) || 0,
      totalOrders: purchase._count.id
    })).sort((a, b) => b.totalAmount - a.totalAmount)
  });
}

async function getPurchasesByProduct(where: any, searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '20');

  const productPurchases = await prisma.purchaseOrderItem.groupBy({
    by: ['variantId'],
    where: {
      purchaseOrder: where
    },
    _sum: {
      quantity: true,
      cost: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        cost: 'desc'
      }
    },
    take: limit
  });

  const variantIds = productPurchases.map(item => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        select: { title: true }
      }
    }
  });

  const variantMap = variants.reduce((acc: any, variant) => {
    acc[variant.id] = variant;
    return acc;
  }, {});

  return NextResponse.json({
    products: productPurchases.map(item => ({
      variantId: item.variantId,
      productTitle: variantMap[item.variantId]?.product.title || 'Producto desconocido',
      variantName: variantMap[item.variantId]?.name || 'Variante desconocida',
      totalQuantity: item._sum.quantity || 0,
      totalCost: Number(item._sum.cost) || 0,
      totalOrders: item._count.id,
      averageCost: item._sum.quantity ? Number(item._sum.cost) / item._sum.quantity : 0
    }))
  });
}

async function getPendingPurchases(where: any) {
  const pendingPurchases = await prisma.purchaseOrder.findMany({
    where: {
      ...where,
      status: 'PENDING'
    },
    include: {
      supplier: {
        select: { name: true, phone: true, email: true }
      },
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { title: true }
              }
            }
          }
        }
      }
    },
    orderBy: { orderDate: 'asc' }
  });

  const totalPendingAmount = pendingPurchases.reduce((sum, purchase) => 
    sum + Number(purchase.totalAmount), 0
  );

  const oldestPending = pendingPurchases.length > 0 ? pendingPurchases[0].orderDate : null;

  return NextResponse.json({
    pendingOrders: pendingPurchases.map(purchase => ({
      id: purchase.id,
      orderDate: purchase.orderDate,
      totalAmount: Number(purchase.totalAmount),
      supplier: purchase.supplier,
      itemsCount: purchase.items.length,
      daysPending: oldestPending ? Math.floor((Date.now() - purchase.orderDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      notes: purchase.notes
    })),
    summary: {
      totalPendingOrders: pendingPurchases.length,
      totalPendingAmount,
      oldestPendingDays: oldestPending ? Math.floor((Date.now() - oldestPending.getTime()) / (1000 * 60 * 60 * 24)) : 0
    }
  });
}