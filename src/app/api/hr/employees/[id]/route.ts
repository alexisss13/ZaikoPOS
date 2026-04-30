import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        shifts: {
          where: { isActive: true },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        payrolls: {
          orderBy: { periodStart: 'desc' },
          take: 12,
        },
        bonuses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        advances: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('[HR_EMPLOYEE_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar empleado' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      role,
      branchId,
      position,
      baseSalary,
      hourlyRate,
      workingHours,
      hireDate,
      isActive,
    } = body;

    const employee = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        branchId,
        position,
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        workingHours: workingHours ? parseInt(workingHours) : undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        isActive,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('[HR_EMPLOYEE_PUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al actualizar empleado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HR_EMPLOYEE_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al desactivar empleado' },
      { status: 500 }
    );
  }
}