import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. Definimos el tipo del contexto según Next.js 15+
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request, 
  context: RouteContext // Cambiamos la firma aquí
) {
  try {
    // 2. 🚀 FIX CRÍTICO: Esperamos a que los params se resuelvan
    const { id } = await context.params;
    
    const body = await req.json();
    const { status } = body; // 'APPROVED' o 'REJECTED'

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!transfer) return NextResponse.json({ error: 'Traslado no encontrado' }, { status: 404 });
    if (transfer.status !== 'PENDING') return NextResponse.json({ error: 'Este traslado ya fue procesado' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizamos el estado del traslado
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: { status }
      });

      // 2. Si se APROBÓ, movemos el stock real
      if (status === 'APPROVED') {
        // Restamos a la tienda de origen
        await tx.stock.update({
          where: { branchId_productId: { branchId: transfer.fromBranchId, productId: transfer.productId } },
          data: { quantity: { decrement: transfer.quantity } }
        });

        // Sumamos a la tienda de destino
        await tx.stock.upsert({
          where: { branchId_productId: { branchId: transfer.toBranchId, productId: transfer.productId } },
          create: { branchId: transfer.toBranchId, productId: transfer.productId, quantity: transfer.quantity },
          update: { quantity: { increment: transfer.quantity } }
        });
      }

      // 3. Notificamos al cajero que lo pidió
      await tx.notification.create({
        data: {
          userId: transfer.requestedById,
          title: status === 'APPROVED' ? 'Traslado Aprobado ✅' : 'Traslado Rechazado ❌',
          message: status === 'APPROVED' 
            ? `Tu solicitud de ${transfer.quantity}x "${transfer.product.title}" fue enviada. El stock ya está en tu sistema.`
            : `Lamentablemente no pudimos enviar los ${transfer.quantity}x "${transfer.product.title}".`,
          type: 'TRANSFER_UPDATE'
        }
      });

      return updatedTransfer;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error procesando traslado:', error);
    return NextResponse.json({ error: 'Error al procesar el traslado' }, { status: 500 });
  }
}