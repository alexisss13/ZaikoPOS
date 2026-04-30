import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQRCode, generateBarcode } from '@/lib/hr-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      role: { not: 'USER' }, // Excluir usuarios de e-commerce
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          shifts: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              startTime: true,
              endTime: true,
              workingDays: true,
            },
          },
          attendances: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
            select: {
              date: true,
              status: true,
              hoursWorked: true,
              isLate: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[HR_EMPLOYEES_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar empleados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    } = body;

    // Generar QR y código de barras únicos
    const qrCode = await generateQRCode();
    const barcode = await generateBarcode();

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        role,
        branchId,
        position,
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        workingHours: workingHours ? parseInt(workingHours) : 8,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        qrCode,
        barcode,
        isActive: true,
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
    console.error('[HR_EMPLOYEES_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al crear empleado' },
      { status: 500 }
    );
  }
}