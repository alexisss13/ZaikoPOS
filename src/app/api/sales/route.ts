import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { logAudit } from '@/lib/audit';

// 1. Esquema estricto para los pagos (Adiós z.any)
const paymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod), // Valida contra el Enum de Prisma
  amount: z.number().positive(),
  reference: z.string().optional().nullable(),
});

const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number(),
  })),
  payments: z.array(paymentSchema),
  externalId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id');
    
    if (!userId || !branchId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validación Zod segura
    const { items, payments, externalId } = saleSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // A. Idempotencia (Evitar duplicados offline)
      if (externalId) {
        const existing = await tx.sale.findUnique({ where: { externalId } });
        if (existing) return existing;
      }
    if (result) {
    // Buscamos el businessId del usuario si no lo tenemos a mano
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessId: true } });
    
    if (user?.businessId) {
        await logAudit({
            action: 'CREATE_SALE',
            businessId: user.businessId,
            userId: userId,
            details: `Venta ${result.code} por S/ ${result.total}`,
        });
    }
}
      // B. Verificación y Descuento de Stock
      for (const item of items) {
        // Buscamos el stock específico en la sucursal
        const stockEntry = await tx.stock.findUnique({
            where: { branchId_productId: { branchId, productId: item.productId } }
        });

        if (!stockEntry || stockEntry.quantity < item.quantity) {
          throw new Error(`STOCK_CONFLICT:${item.productId}`);
        }

        await tx.stock.update({
          where: { id: stockEntry.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // C. Crear Venta
      const totalAmount = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const sale = await tx.sale.create({
        data: {
          externalId,
          branchId,
          userId,
          subtotal: totalAmount,
          total: totalAmount,
          status: 'COMPLETED',
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              subtotal: i.price * i.quantity
            }))
          },
          payments: {
            create: payments.map(p => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference || null
            }))
          }
        }
      });

      return sale;
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    // Manejo tipado de errores
    if (error instanceof Error && error.message?.startsWith('STOCK_CONFLICT')) {
      const productId = error.message.split(':')[1];
      return NextResponse.json(
        { error: 'Stock insuficiente', code: 'CONFLICT', productId }, 
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
       // CORRECCIÓN: Usamos .issues en lugar de .errors para satisfacer al tipado estricto
       return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }

    console.error('Error procesando venta:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}