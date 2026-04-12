import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Verificar que la orden existe y está pendiente
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (purchase.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden cancelar órdenes pendientes' }, { status: 400 });
    }

    // Marcar la orden como cancelada
    const updatedPurchase = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      include: {
        supplier: true,
        createdBy: true,
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            },
            uom: true
          }
        }
      }
    });

    return NextResponse.json(updatedPurchase);
  } catch (error: unknown) {
    console.error('[PURCHASE_CANCEL_ERROR]', error);
    return NextResponse.json({ error: 'Error al cancelar la orden' }, { status: 500 });
  }
}
