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
      status: 'CLOSED',
      ...(Object.keys(dateFilter).length > 0 && { openedAt: dateFilter })
    };

    // Filtros de negocio y sucursal
    if (role !== 'SUPER_ADMIN') {
      where.branch = { businessId };
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
        return await getCashSessionsSummary(where);
      case 'detailed':
        return await getDetailedCashSessions(where, searchParams);
      case 'by-user':
        return await getCashSessionsByUser(where);
      case 'by-branch':
        return await getCashSessionsByBranch(where);
      case 'discrepancies':
        return await getCashDiscrepancies(where);
      default:
        return await getCashSessionsSummary(where);
    }
  } catch (error) {
    console.error('[CASH_SESSIONS_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Error al generar reporte de cortes de turno' }, { status: 500 });
  }
}

async function getCashSessionsSummary(where: any) {
  const [sessions, totalSessions, totals] = await Promise.all([
    prisma.cashSession.findMany({
      where,
      select: {
        initialCash: true,
        finalCash: true,
        income: true,
        expense: true,
        difference: true,
        openedAt: true,
        closedAt: true
      }
    }),
    prisma.cashSession.count({ where }),
    prisma.cashSession.aggregate({
      where,
      _sum: {
        initialCash: true,
        finalCash: true,
        income: true,
        expense: true,
        difference: true
      },
      _avg: {
        difference: true
      }
    })
  ]);

  // Calcular estadísticas adicionales
  const totalHours = sessions.reduce((sum, session) => {
    if (session.closedAt) {
      const hours = (session.closedAt.getTime() - session.openedAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const sessionsWithDiscrepancies = sessions.filter(session => 
    session.difference && Math.abs(Number(session.difference)) > 0.01
  ).length;

  // Agrupar por día para gráfico
  const sessionsByDay = sessions.reduce((acc: any, session) => {
    const date = session.openedAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { 
        date, 
        sessions: 0, 
        income: 0, 
        expense: 0, 
        difference: 0 
      };
    }
    acc[date].sessions += 1;
    acc[date].income += Number(session.income);
    acc[date].expense += Number(session.expense);
    acc[date].difference += Number(session.difference || 0);
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      totalSessions,
      totalInitialCash: Number(totals._sum.initialCash) || 0,
      totalFinalCash: Number(totals._sum.finalCash) || 0,
      totalIncome: Number(totals._sum.income) || 0,
      totalExpense: Number(totals._sum.expense) || 0,
      totalDifference: Number(totals._sum.difference) || 0,
      averageDifference: Number(totals._avg.difference) || 0,
      averageHours: totalSessions > 0 ? totalHours / totalSessions : 0,
      sessionsWithDiscrepancies,
      discrepancyRate: totalSessions > 0 ? (sessionsWithDiscrepancies / totalSessions) * 100 : 0
    },
    chartData: Object.values(sessionsByDay).sort((a: any, b: any) => a.date.localeCompare(b.date))
  });
}

async function getDetailedCashSessions(where: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.cashSession.findMany({
      where,
      include: {
        user: {
          select: { name: true }
        },
        branch: {
          select: { name: true }
        },
        sales: {
          select: {
            total: true
          }
        },
        transactions: true
      },
      orderBy: { openedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.cashSession.count({ where })
  ]);

  return NextResponse.json({
    sessions: sessions.map(session => {
      const totalSales = session.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const sessionHours = session.closedAt ? 
        (session.closedAt.getTime() - session.openedAt.getTime()) / (1000 * 60 * 60) : 0;

      return {
        id: session.id,
        user: session.user.name,
        branch: session.branch.name,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        initialCash: Number(session.initialCash),
        finalCash: Number(session.finalCash),
        income: Number(session.income),
        expense: Number(session.expense),
        difference: Number(session.difference || 0),
        totalSales,
        salesCount: session.sales.length,
        transactionsCount: session.transactions.length,
        sessionHours: Math.round(sessionHours * 100) / 100,
        hasDiscrepancy: Math.abs(Number(session.difference || 0)) > 0.01,
        incidents: session.incidents
      };
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getCashSessionsByUser(where: any) {
  const userSessions = await prisma.cashSession.groupBy({
    by: ['userId'],
    where,
    _sum: {
      income: true,
      expense: true,
      difference: true
    },
    _count: {
      id: true
    },
    _avg: {
      difference: true
    }
  });

  const userIds = userSessions.map(session => session.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });

  const userMap = users.reduce((acc: any, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});

  return NextResponse.json({
    users: userSessions.map(session => ({
      userId: session.userId,
      userName: userMap[session.userId] || 'Usuario desconocido',
      totalSessions: session._count.id,
      totalIncome: Number(session._sum.income) || 0,
      totalExpense: Number(session._sum.expense) || 0,
      totalDifference: Number(session._sum.difference) || 0,
      averageDifference: Number(session._avg.difference) || 0,
      hasDiscrepancies: Math.abs(Number(session._sum.difference || 0)) > 0.01
    })).sort((a, b) => b.totalIncome - a.totalIncome)
  });
}

async function getCashSessionsByBranch(where: any) {
  const branchSessions = await prisma.cashSession.groupBy({
    by: ['branchId'],
    where,
    _sum: {
      income: true,
      expense: true,
      difference: true
    },
    _count: {
      id: true
    },
    _avg: {
      difference: true
    }
  });

  const branchIds = branchSessions.map(session => session.branchId);
  const branches = await prisma.branch.findMany({
    where: { id: { in: branchIds } },
    select: { id: true, name: true, address: true }
  });

  const branchMap = branches.reduce((acc: any, branch) => {
    acc[branch.id] = branch;
    return acc;
  }, {});

  return NextResponse.json({
    branches: branchSessions.map(session => ({
      branchId: session.branchId,
      branch: branchMap[session.branchId] || { name: 'Sucursal desconocida', address: null },
      totalSessions: session._count.id,
      totalIncome: Number(session._sum.income) || 0,
      totalExpense: Number(session._sum.expense) || 0,
      totalDifference: Number(session._sum.difference) || 0,
      averageDifference: Number(session._avg.difference) || 0,
      hasDiscrepancies: Math.abs(Number(session._sum.difference || 0)) > 0.01
    })).sort((a, b) => b.totalIncome - a.totalIncome)
  });
}

async function getCashDiscrepancies(where: any) {
  const discrepancySessions = await prisma.cashSession.findMany({
    where: {
      ...where,
      difference: {
        not: 0
      }
    },
    include: {
      user: {
        select: { name: true }
      },
      branch: {
        select: { name: true }
      }
    },
    orderBy: { difference: 'desc' }
  });

  const totalDiscrepancy = discrepancySessions.reduce((sum, session) => 
    sum + Math.abs(Number(session.difference || 0)), 0
  );

  const positiveDiscrepancies = discrepancySessions.filter(session => 
    Number(session.difference || 0) > 0
  );

  const negativeDiscrepancies = discrepancySessions.filter(session => 
    Number(session.difference || 0) < 0
  );

  return NextResponse.json({
    discrepancies: discrepancySessions.map(session => ({
      id: session.id,
      user: session.user.name,
      branch: session.branch.name,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialCash: Number(session.initialCash),
      finalCash: Number(session.finalCash),
      expectedCash: Number(session.initialCash) + Number(session.income) - Number(session.expense),
      actualCash: Number(session.finalCash),
      difference: Number(session.difference || 0),
      discrepancyType: Number(session.difference || 0) > 0 ? 'SURPLUS' : 'DEFICIT',
      incidents: session.incidents
    })),
    summary: {
      totalDiscrepancies: discrepancySessions.length,
      totalDiscrepancyAmount: totalDiscrepancy,
      positiveDiscrepancies: positiveDiscrepancies.length,
      negativeDiscrepancies: negativeDiscrepancies.length,
      averageDiscrepancy: discrepancySessions.length > 0 ? totalDiscrepancy / discrepancySessions.length : 0
    }
  });
}