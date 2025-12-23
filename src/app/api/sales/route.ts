import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { logAudit } from '@/lib/audit';

const paymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(), // 👈 Validación estricta
  reference: z.string().optional().nullable(),
});

const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(), // 👈 Enteros y positivos para stock
    price: z.number().min(0), // 👈 Precio no negativo (puede ser 0 si es promo)
  })),
  payments: z.array(paymentSchema),
  externalId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id');
    
    if (!userId || !branchId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const body = await req.json();
    const { items, payments, externalId } = saleSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Idempotencia
      if (externalId) {
        const existing = await tx.sale.findUnique({ where: { externalId } });
        if (existing) return existing;
      }

      // Stock Check
      for (const item of items) {
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

      // Cálculo de Totales (JS numbers -> Decimal Prisma lo maneja)
      const totalAmount = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const sale = await tx.sale.create({
        data: {
          externalId,
          branchId,
          userId,
          businessId: (await tx.user.findUnique({ where: { id: userId }, select: { businessId: true } }))?.businessId, // 👈 Vincular Business
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
    if (error instanceof Error && error.message?.startsWith('STOCK_CONFLICT')) {
      const productId = error.message.split(':')[1];
      return NextResponse.json({ error: 'Stock insuficiente', code: 'CONFLICT', productId }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
       return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error venta:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}