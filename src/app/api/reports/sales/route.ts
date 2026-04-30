import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userBranchId = req.headers.get('x-branch-id');

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');
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
      status: 'COMPLETED',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    };

    // Filtros de negocio y sucursal
    if (role !== 'SUPER_ADMIN') {
      where.businessId = businessId;
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    } else if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && userBranchId && userBranchId !== 'NONE') {
      where.branchId = userBranchId;
    }

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    switch (reportType) {
      case 'summary':
        return await getSalesSummary(where);
      case 'detailed':
        return await getDetailedSales(where, searchParams);
      case 'by-product':
        return await getSalesByProduct(where, searchParams);
      case 'by-category':
        return await getSalesByCategory(where, searchParams);
      case 'by-payment':
        return await getSalesByPaymentMethod(where);
      case 'by-user':
        return await getSalesByUser(where);
      case 'by-hour':
        return await getSalesByHour(where);
      default:
        return await getSalesSummary(where);
    }
  } catch (error) {
    console.error('[SALES_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Error al generar reporte de ventas' }, { status: 500 });
  }
}

async function getSalesSummary(where: any) {
  const [sales, totalSales, totalItems, averageTicket] = await Promise.all([
    prisma.sale.findMany({
      where,
      select: {
        total: true,
        discount: true,
        createdAt: true,
        items: {
          select: {
            quantity: true
          }
        }
      }
    }),
    prisma.sale.count({ where }),
    prisma.saleItem.aggregate({
      where: {
        sale: where
      },
      _sum: {
        quantity: true
      }
    }),
    prisma.sale.aggregate({
      where,
      _avg: {
        total: true
      }
    })
  ]);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount), 0);

  // Agrupar por día para gráfico
  const salesByDay = sales.reduce((acc: any, sale) => {
    const date = sale.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, sales: 0, revenue: 0, items: 0 };
    }
    acc[date].sales += 1;
    acc[date].revenue += Number(sale.total);
    acc[date].items += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      totalSales,
      totalRevenue,
      totalDiscount,
      totalItems: totalItems._sum.quantity || 0,
      averageTicket: Number(averageTicket._avg.total) || 0
    },
    chartData: Object.values(salesByDay).sort((a: any, b: any) => a.date.localeCompare(b.date))
  });
}

async function getDetailedSales(where: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        user: {
          select: { name: true }
        },
        customer: {
          select: { name: true, docNumber: true }
        },
        branch: {
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
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.sale.count({ where })
  ]);

  return NextResponse.json({
    sales,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getSalesByProduct(where: any, searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '20');

  const productSales = await prisma.saleItem.groupBy({
    by: ['productName'],
    where: {
      sale: where
    },
    _sum: {
      quantity: true,
      subtotal: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        subtotal: 'desc'
      }
    },
    take: limit
  });

  return NextResponse.json({
    products: productSales.map(item => ({
      productName: item.productName,
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.subtotal) || 0,
      totalSales: item._count.id
    }))
  });
}

async function getSalesByCategory(where: any, searchParams: URLSearchParams) {
  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const categoryStats: any = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const categoryName = item.variant?.product?.category?.name || 'Sin categoría';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          categoryName,
          totalQuantity: 0,
          totalRevenue: 0,
          totalSales: 0
        };
      }
      categoryStats[categoryName].totalQuantity += item.quantity;
      categoryStats[categoryName].totalRevenue += Number(item.subtotal);
      categoryStats[categoryName].totalSales += 1;
    });
  });

  return NextResponse.json({
    categories: Object.values(categoryStats).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
  });
}

async function getSalesByPaymentMethod(where: any) {
  const payments = await prisma.salePayment.groupBy({
    by: ['method'],
    where: {
      sale: where
    },
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  });

  return NextResponse.json({
    paymentMethods: payments.map(payment => ({
      method: payment.method,
      totalAmount: Number(payment._sum.amount) || 0,
      totalTransactions: payment._count.id
    }))
  });
}

async function getSalesByUser(where: any) {
  const userSales = await prisma.sale.groupBy({
    by: ['userId'],
    where,
    _sum: {
      total: true
    },
    _count: {
      id: true
    }
  });

  const userIds = userSales.map(sale => sale.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });

  const userMap = users.reduce((acc: any, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});

  return NextResponse.json({
    users: userSales.map(sale => ({
      userId: sale.userId,
      userName: userMap[sale.userId] || 'Usuario desconocido',
      totalRevenue: Number(sale._sum.total) || 0,
      totalSales: sale._count.id
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)
  });
}

async function getSalesByHour(where: any) {
  const sales = await prisma.sale.findMany({
    where,
    select: {
      total: true,
      createdAt: true
    }
  });

  const hourlyStats: any = {};
  for (let i = 0; i < 24; i++) {
    hourlyStats[i] = { hour: i, sales: 0, revenue: 0 };
  }

  sales.forEach(sale => {
    const hour = sale.createdAt.getHours();
    hourlyStats[hour].sales += 1;
    hourlyStats[hour].revenue += Number(sale.total);
  });

  return NextResponse.json({
    hourlyData: Object.values(hourlyStats)
  });
}