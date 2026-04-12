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
    const { stockDistribution } = body;

    if (!stockDistribution || typeof stockDistribution !== 'object') {
      return NextResponse.json({ error: 'Se requiere la distribución de stock' }, { status: 400 });
    }

    // Verificar que la orden existe y está pendiente
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: true
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (purchase.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden recibir órdenes pendientes' }, { status: 400 });
    }

    // Validar que todas las cantidades coincidan
    for (const item of purchase.items) {
      const itemDistribution = stockDistribution[item.id];
      
      if (!itemDistribution) {
        return NextResponse.json({ 
          error: `Falta distribución para el producto: ${item.variant.name}` 
        }, { status: 400 });
      }

      const totalDistributed = Object.values(itemDistribution).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0);
      
      if (totalDistributed !== item.quantity) {
        return NextResponse.json({ 
          error: `La distribución del producto "${item.variant.name}" no coincide: ${totalDistributed} de ${item.quantity}` 
        }, { status: 400 });
      }
    }

    // Actualizar el stock según la distribución en una transacción
    await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const itemDistribution = stockDistribution[item.id];
        
        for (const [branchId, quantity] of Object.entries(itemDistribution)) {
          const qty = Number(quantity);
          
          if (qty <= 0) continue; // Saltar si no hay cantidad para esta sucursal
          
          // Verificar que la sucursal existe
          const branch = await tx.branch.findUnique({
            where: { id: branchId }
          });

          if (!branch) {
            throw new Error(`Sucursal no encontrada: ${branchId}`);
          }

          // Buscar el stock actual (dentro de la transacción para obtener el valor más reciente)
          const existingStock = await tx.stock.findUnique({
            where: {
              branchId_variantId: {
                branchId: branchId,
                variantId: item.variantId
              }
            }
          });
          
          const previousStock = existingStock?.quantity || 0;
          const newStock = previousStock + qty;
          
          if (existingStock) {
            // Actualizar stock existente
            await tx.stock.update({
              where: { id: existingStock.id },
              data: {
                quantity: newStock
              }
            });
          } else {
            // Crear nuevo registro de stock
            await tx.stock.create({
              data: {
                branchId: branchId,
                variantId: item.variantId,
                quantity: qty
              }
            });
          }

          // Registrar movimiento de stock con el previousStock correcto
          if (userId) {
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                branchId: branchId,
                userId,
                type: 'PURCHASE',
                quantity: qty,
                previousStock: previousStock,
                currentStock: newStock,
                reason: `Recepción de orden de compra #${purchase.id.slice(0, 8)}`
              }
            });
          }
        }
      }

      // Marcar la orden como recibida
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date()
        }
      });
    });

    // Obtener la orden actualizada con todas las relaciones
    const updatedPurchase = await prisma.purchaseOrder.findUnique({
      where: { id },
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
    console.error('[PURCHASE_RECEIVE_ERROR]', error);
    return NextResponse.json({ error: 'Error al recibir la orden' }, { status: 500 });
  }
}
