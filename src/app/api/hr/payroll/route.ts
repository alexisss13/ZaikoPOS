import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePayroll } from '@/lib/hr-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || '';
    const type = searchParams.get('type') || '';
    const isPaid = searchParams.get('isPaid');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isPaid !== null && isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              position: true,
              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      }),
      prisma.payroll.count({ where }),
    ]);

    return NextResponse.json({
      payrolls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[HR_PAYROLL_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar nóminas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, periodStart, periodEnd } = body;

    // Obtener datos del empleado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(periodStart),
              lte: new Date(periodEnd),
            },
          },
        },
        bonuses: {
          where: {
            isApplied: false,
            createdAt: {
              gte: new Date(periodStart),
              lte: new Date(periodEnd),
            },
          },
        },
        advances: {
          where: {
            status: 'APPROVED',
            paidAt: null,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Calcular horas trabajadas
    const totalHoursWorked = user.attendances.reduce((sum, attendance) => {
      return sum + (attendance.hoursWorked?.toNumber() || 0);
    }, 0);

    const expectedHours = user.workingHours || 8;
    const expectedTotalHours = type === 'WEEKLY' ? expectedHours * 5 : expectedHours * 22; // Aproximado

    // Calcular salario base
    const baseSalary = user.baseSalary?.toNumber() || 0;
    const hourlyRate = user.hourlyRate?.toNumber();

    const payrollCalc = calculatePayroll(
      baseSalary,
      totalHoursWorked,
      expectedTotalHours,
      hourlyRate
    );

    // Calcular bonos
    const bonusAmount = user.bonuses.reduce((sum, bonus) => {
      return sum + bonus.amount.toNumber();
    }, 0);

    // Calcular adelantos
    const advanceAmount = user.advances.reduce((sum, advance) => {
      return sum + advance.amount.toNumber();
    }, 0);

    const totalPaid = payrollCalc.totalAmount + bonusAmount - advanceAmount;

    // Crear nómina
    const payroll = await prisma.payroll.create({
      data: {
        userId,
        type,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        baseAmount: payrollCalc.baseAmount,
        hoursWorked: totalHoursWorked,
        overtimeHours: Math.max(0, totalHoursWorked - expectedTotalHours),
        bonusAmount,
        deductions: payrollCalc.deductions,
        advanceAmount,
        totalPaid,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });

    // Marcar bonos como aplicados
    if (user.bonuses.length > 0) {
      await prisma.bonus.updateMany({
        where: {
          id: { in: user.bonuses.map(b => b.id) },
        },
        data: {
          isApplied: true,
          appliedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ payroll });
  } catch (error) {
    console.error('[HR_PAYROLL_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al crear nómina' },
      { status: 500 }
    );
  }
}