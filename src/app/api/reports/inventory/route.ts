import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userBranchId = req.headers.get('x-branch-id');

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const categoryId = searchParams.get('categoryId');
    const reportType = searchParams.get('type') || 'summary';
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    // Construir filtros base
    const where: any = {
      variant: {
        active: true,
        product: {
          active: true
        }
      }
    };

    // Filtros de negocio y sucursal
    if (role !== 'SUPER_ADMIN') {
      where.variant.product.OR = [
        { businessId },
        { businessId: null }
      ];
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    } else if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && userBranchId && userBranchId !== 'NONE') {
      where.branchId = userBranchId;
    }

    if (categoryId && categoryId !== 'all') {
      where.variant.product.categoryId = categoryId;
    }

    switch (reportType) {
      case 'summary':
        return await getInventorySummary(where, lowStockOnly);
      case 'detailed':
        return await getDetailedInventory(where, searchParams);
      case 'movements':
        return await getStockMovements(where, searchParams);
      case 'low-stock':
        return await getLowStockItems(where);
      case 'by-category':
        return await getInventoryByCategory(where);
      case 'valuation':
        return await getInventoryValuation(where);
      default:
        return await getInventorySummary(where, lowStockOnly);
    }
  } catch (error) {
    console.error('[INVENTORY_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Error al generar reporte de inventario' }, { status: 500 });
  }
}

async function getInventorySummary(where: any, lowStockOnly: boolean) {
  const [totalProducts, totalStock, lowStockItems, stockValue] = await Promise.all([
    prisma.stock.count({ where }),
    prisma.stock.aggregate({
      where,
      _sum: { quantity: true }
    }),
    prisma.stock.count({
      where: {
        ...where,
        quantity: { lte: 5 } // Simplified low stock check
      }
    }),
    prisma.stock.findMany({
      where,
      include: {
        variant: {
          select: {
            cost: true,
            price: true
          }
        }
      }
    })
  ]);

  const totalCostValue = stockValue.reduce((sum, item) => 
    sum + (Number(item.variant.cost) * item.quantity), 0
  );

  const totalSaleValue = stockValue.reduce((sum, item) => 
    sum + (Number(item.variant.price) * item.quantity), 0
  );

  return NextResponse.json({
    summary: {
      totalProducts,
      totalStock: totalStock._sum.quantity || 0,
      lowStockItems,
      totalCostValue,
      totalSaleValue,
      potentialProfit: totalSaleValue - totalCostValue
    }
  });
}

async function getDetailedInventory(where: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;
  const search = searchParams.get('search') || '';

  const searchFilter = search ? {
    ...where,
    OR: [
      { variant: { product: { title: { contains: search, mode: 'insensitive' } } } },
      { variant: { name: { contains: search, mode: 'insensitive' } } },
      { variant: { sku: { contains: search, mode: 'insensitive' } } },
      { variant: { barcode: { contains: search, mode: 'insensitive' } } }
    ]
  } : where;

  const [stock, total] = await Promise.all([
    prisma.stock.findMany({
      where: searchFilter,
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
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.stock.count({ where: searchFilter })
  ]);

  return NextResponse.json({
    inventory: stock.map(item => ({
      id: item.id,
      productTitle: item.variant.product.title,
      variantName: item.variant.name,
      sku: item.variant.sku,
      barcode: item.variant.barcode,
      category: item.variant.product.category.name,
      branch: item.branch.name,
      quantity: item.quantity,
      minStock: item.variant.minStock,
      cost: Number(item.variant.cost),
      price: Number(item.variant.price),
      totalCostValue: Number(item.variant.cost) * item.quantity,
      totalSaleValue: Number(item.variant.price) * item.quantity,
      isLowStock: item.quantity <= item.variant.minStock,
      updatedAt: item.updatedAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getStockMovements(where: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const dateFilter: any = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const movementWhere: any = {
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
  };

  // Apply branch filter to movements
  if (where.branchId) {
    movementWhere.branchId = where.branchId;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: movementWhere,
      include: {
        variant: {
          include: {
            product: {
              select: { title: true }
            }
          }
        },
        branch: {
          select: { name: true }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.stockMovement.count({ where: movementWhere })
  ]);

  return NextResponse.json({
    movements: movements.map(movement => ({
      id: movement.id,
      productTitle: movement.variant.product.title,
      variantName: movement.variant.name,
      branch: movement.branch.name,
      user: movement.user.name,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      currentStock: movement.currentStock,
      reason: movement.reason,
      createdAt: movement.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getLowStockItems(where: any) {
  const lowStockItems = await prisma.stock.findMany({
    where: {
      ...where,
      quantity: { lte: 10 } // Simplified check
    },
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
      },
      branch: {
        select: { name: true }
      }
    },
    orderBy: { quantity: 'asc' }
  });

  return NextResponse.json({
    lowStockItems: lowStockItems.map(item => ({
      id: item.id,
      productTitle: item.variant.product.title,
      variantName: item.variant.name,
      category: item.variant.product.category.name,
      branch: item.branch.name,
      currentStock: item.quantity,
      minStock: item.variant.minStock,
      deficit: Math.max(0, item.variant.minStock - item.quantity),
      cost: Number(item.variant.cost),
      price: Number(item.variant.price)
    }))
  });
}

async function getInventoryByCategory(where: any) {
  const inventory = await prisma.stock.findMany({
    where,
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
  });

  const categoryStats: any = {};

  inventory.forEach(item => {
    const categoryName = item.variant.product.category.name;
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = {
        categoryName,
        totalProducts: 0,
        totalStock: 0,
        totalCostValue: 0,
        totalSaleValue: 0,
        lowStockItems: 0
      };
    }

    categoryStats[categoryName].totalProducts += 1;
    categoryStats[categoryName].totalStock += item.quantity;
    categoryStats[categoryName].totalCostValue += Number(item.variant.cost) * item.quantity;
    categoryStats[categoryName].totalSaleValue += Number(item.variant.price) * item.quantity;
    
    if (item.quantity <= item.variant.minStock) {
      categoryStats[categoryName].lowStockItems += 1;
    }
  });

  return NextResponse.json({
    categories: Object.values(categoryStats).sort((a: any, b: any) => b.totalSaleValue - a.totalSaleValue)
  });
}

async function getInventoryValuation(where: any) {
  const inventory = await prisma.stock.findMany({
    where,
    include: {
      variant: {
        select: {
          cost: true,
          price: true,
          product: {
            select: {
              title: true,
              category: {
                select: { name: true }
              }
            }
          }
        }
      }
    }
  });

  const totalCostValue = inventory.reduce((sum, item) => 
    sum + (Number(item.variant.cost) * item.quantity), 0
  );

  const totalSaleValue = inventory.reduce((sum, item) => 
    sum + (Number(item.variant.price) * item.quantity), 0
  );

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return NextResponse.json({
    valuation: {
      totalCostValue,
      totalSaleValue,
      potentialProfit: totalSaleValue - totalCostValue,
      profitMargin: totalCostValue > 0 ? ((totalSaleValue - totalCostValue) / totalCostValue) * 100 : 0,
      totalItems,
      averageCostPerItem: totalItems > 0 ? totalCostValue / totalItems : 0,
      averageSalePerItem: totalItems > 0 ? totalSaleValue / totalItems : 0
    }
  });
}