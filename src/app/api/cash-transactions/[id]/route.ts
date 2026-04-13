import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Obtener la transacción para verificar que existe y obtener sus datos
    const transaction = await prisma.cashTransaction.findUnique({
      where: { id },
      include: {
        cashSession: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }

    // Verificar que la sesión de caja esté abierta
    if (transaction.cashSession.status !== 'OPEN') {
      return NextResponse.json({ error: 'No se puede eliminar transacciones de una sesión cerrada' }, { status: 400 });
    }

    // Eliminar la transacción y actualizar los totales de la sesión
    await prisma.$transaction(async (tx) => {
      // Eliminar la transacción
      await tx.cashTransaction.delete({
        where: { id }
      });

      // Actualizar income o expense en la sesión (restar el monto)
      const updateData = transaction.type === 'INCOME'
        ? { income: { decrement: transaction.amount } }
        : { expense: { decrement: transaction.amount } };

      await tx.cashSession.update({
        where: { id: transaction.cashSessionId },
        data: updateData
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    return NextResponse.json(
      { error: 'Error al eliminar transacción' },
      { status: 500 }
    );
  }
}
