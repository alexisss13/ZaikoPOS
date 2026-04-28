import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { adjustedCosts } = body;

    if (!adjustedCosts || typeof adjustedCosts !== 'object') {
      return NextResponse.json({ error: 'Se requieren los costos ajustados' }, { status: 400 });
    }

    // Verificar que la orden existe y está pendiente
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (purchase.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden ajustar costos de órdenes pendientes' }, { status: 400 });
    }

    // Validar que todos los items tengan costos válidos
    for (const item of purchase.items) {
      const newCost = adjustedCosts[item.id];
      
      if (newCost === undefined || newCost === null) {
        return NextResponse.json({ 
          error: `Falta costo para el item: ${item.id}` 
        }, { status: 400 });
      }

      if (Number(newCost) <= 0) {
        return NextResponse.json({ 
          error: `El costo debe ser mayor a 0 para el item: ${item.id}` 
        }, { status: 400 });
      }
    }

    // Actualizar los costos y calcular el nuevo total
    let newTotalAmount = 0;
    const updatePromises = purchase.items.map(async (item) => {
      const newCost = Number(adjustedCosts[item.id]);
      newTotalAmount += item.quantity * newCost;
      
      return prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          cost: newCost,
          // Marcar como modificado si el costo cambió
          costModified: newCost !== Number(item.cost)
        }
      });
    });

    // Ejecutar todas las actualizaciones en una transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar los items
      await Promise.all(updatePromises.map(promise => 
        promise.then(update => tx.purchaseOrderItem.update({
          where: { id: update.id },
          data: {
            cost: update.cost,
            costModified: update.costModified
          }
        }))
      ));

      // Actualizar el total de la orden
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          updatedAt: new Date()
        }
      });

      // Registrar el cambio en auditoría si hay userId
      // Temporalmente comentado para evitar problemas con el enum
      /*
      if (userId) {
        await tx.auditLog.create({
          data: {
            businessId: purchase.businessId,
            userId,
            action: 'UPDATE_STOCK',
            details: {
              type: 'cost_adjustment',
              entityType: 'PurchaseOrder',
              entityId: id,
              originalTotal: Number(purchase.totalAmount),
              newTotal: newTotalAmount,
              adjustedCosts
            }
          }
        });
      }
      */
    });

    // Obtener la orden actualizada
    const updatedPurchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            name: true,
            phone: true,
          }
        },
        createdBy: {
          select: {
            name: true,
          }
        },
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
    console.error('[PURCHASE_ADJUST_COSTS_ERROR]', error);
    return NextResponse.json({ error: 'Error al ajustar costos' }, { status: 500 });
  }
}