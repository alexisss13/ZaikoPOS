import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const updateData: any = { status };

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const advance = await prisma.advance.update({
      where: { id },
      data: updateData,
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
    console.error('[HR_ADVANCE_PUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Error al actualizar adelanto' },
      { status: 500 }
    );
  }
}