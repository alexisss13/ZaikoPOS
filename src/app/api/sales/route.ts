import { NextResponse } from 'next/server';
import { saleService } from '@/services/sale.service';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

const paymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(),
  reference: z.string().optional().nullable(),
});

const saleSchema = z.object({
  externalId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().min(0), 
  })).min(1),
  payments: z.array(paymentSchema).min(1),
  tenderedAmount: z.number().min(0), // NUEVO: Validamos que envíen el monto entregado
  customerId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id');
    
    if (!userId || !branchId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const body = await req.json();
    
    // Parseo y validación estricta con Zod
    const validatedData = saleSchema.parse(body);

    // Delegamos toda la lógica al servicio
    const sale = await saleService.createSale({
      userId,
      branchId,
      ...validatedData
    });

    return NextResponse.json(sale, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
       return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    
    if (error instanceof Error) {
      // Manejo de errores específicos del negocio lanzados por el servicio
      if (error.message.startsWith('STOCK_CONFLICT')) {
        const productId = error.message.split(':')[1];
        return NextResponse.json({ error: 'Stock insuficiente', code: 'CONFLICT', productId }, { status: 409 });
      }
      if (error.message === 'CAJA_CERRADA') {
        return NextResponse.json({ error: 'No puedes realizar una venta sin una caja abierta.' }, { status: 409 });
      }
      if (error.message === 'PAGOS_NO_CUADRAN') {
        return NextResponse.json({ error: 'La suma de los pagos no coincide con el total de la venta.' }, { status: 400 });
      }
      if (error.message === 'MONTO_ENTREGADO_MENOR') {
        return NextResponse.json({ error: 'El monto entregado por el cliente no puede ser menor al total de la venta.' }, { status: 400 });
      }
    }
    
    console.error('Error procesando venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}