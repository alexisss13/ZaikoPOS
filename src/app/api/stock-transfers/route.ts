import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, fromBranchId, toBranchId, requestedById, quantity } = body;

    // Validaciones básicas
    if (!productId || !fromBranchId || !toBranchId || !requestedById || !quantity) {
      return NextResponse.json({ error: 'Faltan datos requeridos para el traslado' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a cero' }, { status: 400 });
    }

    // Ejecutamos una transacción: Crear el traslado y la notificación juntos
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          productId,
          fromBranchId,
          toBranchId,
          requestedById,
          quantity: Number(quantity),
          status: 'PENDING'
        }
      });

      // Creamos una notificación general (puedes refinar el userId luego para que solo le llegue a los dueños de fromBranchId)
      await tx.notification.create({
        data: {
          title: 'Solicitud de Traslado',
          message: `Se han solicitado ${quantity} unidades para otra sucursal.`,
          type: 'TRANSFER_REQUEST'
        }
      });

      return transfer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creando traslado:', error);
    return NextResponse.json({ error: 'Error interno del servidor al crear traslado' }, { status: 500 });
  }
}