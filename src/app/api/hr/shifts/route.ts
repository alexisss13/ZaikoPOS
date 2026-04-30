import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: any = { isActive: true };
    
    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('[HR_SHIFTS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar turnos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, type, startTime, endTime, workingDays } = body;

    const shift = await prisma.shift.create({
      data: {
        userId,
        name,
        type,
        startTime,
        endTime,
        workingDays,
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

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('[HR_SHIFTS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al crear turno' },
      { status: 500 }
    );
  }
}