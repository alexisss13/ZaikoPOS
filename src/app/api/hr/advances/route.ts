import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [advances, total] = await Promise.all([
      prisma.advance.findMany({
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
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.advance.count({ where }),
    ]);

    return NextResponse.json({
      advances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[HR_ADVANCES_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar adelantos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, reason } = body;

    const advance = await prisma.advance.create({
      data: {
        userId,
        amount: parseFloat(amount),
        reason,
        status: 'PENDING',
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

    return NextResponse.json({ advance });
  } catch (error) {
    console.error('[HR_ADVANCES_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al crear adelanto' },
      { status: 500 }
    );
  }
}