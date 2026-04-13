import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { cashSessionId, type, amount, description } = await req.json();

    if (!cashSessionId || !type || !amount || !description) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json({ error: 'Tipo de transacción inválido' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
    }

    // Verificar que la sesión de caja existe y está abierta
    const cashSession = await prisma.cashSession.findUnique({
      where: { id: cashSessionId }
    });

    if (!cashSession) {
      return NextResponse.json({ error: 'Sesión de caja no encontrada' }, { status: 404 });
    }

    if (cashSession.status !== 'OPEN') {
      return NextResponse.json({ error: 'La sesión de caja está cerrada' }, { status: 400 });
    }

    // Crear la transacción y actualizar los totales de la sesión
    const transaction = await prisma.$transaction(async (tx) => {
      // Crear la transacción
      const newTransaction = await tx.cashTransaction.create({
        data: {
          cashSessionId,
          type,
          amount,
          description
        }
      });

      // Actualizar income o expense en la sesión
      const updateData = type === 'INCOME'
        ? { income: { increment: amount } }
        : { expense: { increment: amount } };

      await tx.cashSession.update({
        where: { id: cashSessionId },
        data: updateData
      });

      return newTransaction;
    });

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('Error al crear transacción de caja:', error);
    return NextResponse.json(
      { error: 'Error al crear transacción de caja' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cashSessionId = searchParams.get('cashSessionId');

    if (!cashSessionId) {
      return NextResponse.json({ error: 'cashSessionId requerido' }, { status: 400 });
    }

    const transactions = await prisma.cashTransaction.findMany({
      where: { cashSessionId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transactions);

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}
