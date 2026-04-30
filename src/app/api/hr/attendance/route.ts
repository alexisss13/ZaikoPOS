import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateWorkingHours, isLateArrival } from '@/lib/hr-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
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
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      attendances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[HR_ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar asistencias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, qrCode, barcode } = body; // type: 'checkin' | 'checkout'

    // Buscar usuario por QR o código de barras
    let user;
    if (qrCode) {
      user = await prisma.user.findUnique({
        where: { qrCode },
        include: {
          shifts: {
            where: { isActive: true },
            take: 1,
          },
        },
      });
    } else if (barcode) {
      user = await prisma.user.findUnique({
        where: { barcode },
        include: {
          shifts: {
            where: { isActive: true },
            take: 1,
          },
        },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          shifts: {
            where: { isActive: true },
            take: 1,
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Buscar asistencia del día
    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayDate,
        },
      },
    });

    if (type === 'checkin') {
      if (attendance && attendance.checkIn) {
        return NextResponse.json(
          { error: 'Ya has marcado entrada hoy' },
          { status: 400 }
        );
      }

      // Verificar si llega tarde
      let isLate = false;
      let lateMinutes = 0;
      
      if (user.shifts.length > 0) {
        const shift = user.shifts[0];
        const lateCheck = isLateArrival(today, shift.startTime);
        isLate = lateCheck.isLate;
        lateMinutes = lateCheck.lateMinutes;
      }

      if (attendance) {
        // Actualizar asistencia existente
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: today,
            status: isLate ? 'LATE' : 'PRESENT',
            isLate,
            lateMinutes,
          },
        });
      } else {
        // Crear nueva asistencia
        attendance = await prisma.attendance.create({
          data: {
            userId: user.id,
            date: todayDate,
            checkIn: today,
            status: isLate ? 'LATE' : 'PRESENT',
            isLate,
            lateMinutes,
          },
        });
      }

      // Crear sesión de trabajo
      await prisma.workSession.create({
        data: {
          userId: user.id,
          shiftId: user.shifts.length > 0 ? user.shifts[0].id : null,
          startTime: today,
        },
      });

    } else if (type === 'checkout') {
      if (!attendance || !attendance.checkIn) {
        return NextResponse.json(
          { error: 'Debes marcar entrada primero' },
          { status: 400 }
        );
      }

      if (attendance.checkOut) {
        return NextResponse.json(
          { error: 'Ya has marcado salida hoy' },
          { status: 400 }
        );
      }

      // Calcular horas trabajadas
      const hoursWorked = calculateWorkingHours(attendance.checkIn, today);

      // Actualizar asistencia
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: today,
          hoursWorked,
        },
      });

      // Cerrar sesión de trabajo activa
      const activeSession = await prisma.workSession.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          endTime: null,
        },
      });

      if (activeSession) {
        await prisma.workSession.update({
          where: { id: activeSession.id },
          data: {
            endTime: today,
            isActive: false,
          },
        });
      }
    }

    return NextResponse.json({ 
      attendance,
      user: {
        id: user.id,
        name: user.name,
        position: user.position,
      },
      message: type === 'checkin' ? 'Entrada registrada correctamente' : 'Salida registrada correctamente'
    });
  } catch (error) {
    console.error('[HR_ATTENDANCE_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al registrar asistencia' },
      { status: 500 }
    );
  }
}