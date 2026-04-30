import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || '';
    const type = searchParams.get('type') || '';
    const isApplied = searchParams.get('isApplied');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isApplied !== null && isApplied !== undefined) {
      where.isApplied = isApplied === 'true';
    }

    const [bonuses, total] = await Promise.all([
      prisma.bonus.findMany({
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bonus.count({ where }),
    ]);

    return NextResponse.json({
      bonuses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[HR_BONUSES_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, amount, description } = body;

    const bonus = await prisma.bonus.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        description,
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

    return NextResponse.json({ bonus });
  } catch (error) {
    console.error('[HR_BONUSES_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al crear bono' },
      { status: 500 }
    );
  }
}