import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status } = body; // 'APPROVED' o 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { title: true } }
              }
            }
          }
        },
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        requestedBy: { select: { name: true } }
      }
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Traslado no encontrado' }, { status: 404 });
    }

    if (transfer.status !== 'PENDING') {
      return NextResponse.json({ error: 'Este traslado ya fue procesado' }, { status: 400 });
    }

    // Solo OWNER, MANAGER de sucursal origen pueden aprobar/rechazar
    if (role !== 'OWNER' && role !== 'SUPER_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { branchId: true, role: true }
      });

      if (user?.role !== 'MANAGER' || user?.branchId !== transfer.fromBranchId) {
        return NextResponse.json({ error: 'No tienes permisos para aprobar este traslado' }, { status: 403 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado del traslado
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: { status }
      });

      // 2. Si se APROBÓ, mover el stock y registrar en kardex
      if (status === 'APPROVED') {
        for (const item of transfer.items) {
          // Obtener stock actual de origen
          const originStock = await tx.stock.findUnique({
            where: {
              branchId_variantId: {
                branchId: transfer.fromBranchId,
                variantId: item.variantId
              }
            }
          });

          if (!originStock || originStock.quantity < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.variant.product.title}`);
          }

          const previousStockOrigin = originStock.quantity;
          const newStockOrigin = previousStockOrigin - item.quantity;

          // Restar de sucursal origen
          await tx.stock.update({
            where: {
              branchId_variantId: {
                branchId: transfer.fromBranchId,
                variantId: item.variantId
              }
            },
            data: { quantity: newStockOrigin }
          });

          // Registrar movimiento de SALIDA en origen
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              branchId: transfer.fromBranchId,
              userId: userId,
              type: 'TRANSFER',
              quantity: item.quantity,
              previousStock: previousStockOrigin,
              currentStock: newStockOrigin,
              reason: `Traslado a ${transfer.toBranch.name} (Aprobado)`
            }
          });

          // Obtener o crear stock en destino
          const destStock = await tx.stock.findUnique({
            where: {
              branchId_variantId: {
                branchId: transfer.toBranchId,
                variantId: item.variantId
              }
            }
          });

          const previousStockDest = destStock?.quantity || 0;
          const newStockDest = previousStockDest + item.quantity;

          // Sumar a sucursal destino
          await tx.stock.upsert({
            where: {
              branchId_variantId: {
                branchId: transfer.toBranchId,
                variantId: item.variantId
              }
            },
            create: {
              branchId: transfer.toBranchId,
              variantId: item.variantId,
              quantity: item.quantity
            },
            update: {
              quantity: newStockDest
            }
          });

          // Registrar movimiento de ENTRADA en destino
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              branchId: transfer.toBranchId,
              userId: userId,
              type: 'TRANSFER',
              quantity: item.quantity,
              previousStock: previousStockDest,
              currentStock: newStockDest,
              reason: `Traslado desde ${transfer.fromBranch.name} (Recibido)`
            }
          });
        }
      }

      // 3. Notificar al solicitante
      await tx.notification.create({
        data: {
          userId: transfer.requestedById,
          title: status === 'APPROVED' ? 'Traslado Aprobado ✅' : 'Traslado Rechazado ❌',
          message: status === 'APPROVED' 
            ? `Tu solicitud de traslado de ${transfer.items.length} producto(s) fue aprobada y el stock ya está disponible en ${transfer.toBranch.name}.`
            : `Tu solicitud de traslado de ${transfer.items.length} producto(s) fue rechazada.`,
          type: 'TRANSFER_UPDATE'
        }
      });

      return updatedTransfer;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[STOCK_TRANSFER_PATCH_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error al procesar el traslado' }, { status: 500 });
  }
}
