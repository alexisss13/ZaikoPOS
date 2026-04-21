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
  branchId: z.string().optional(), // Permitir branchId en el body para OWNER
  items: z.array(z.object({
    variantId: z.string(),
    productName: z.string(),
    variantName: z.string().optional(),
    quantity: z.number().int().positive(),
    price: z.number().min(0), 
  })).min(1),
  payments: z.array(paymentSchema).min(1),
  tenderedAmount: z.number().min(0),
  customerId: z.string().nullable().optional(),
  discount: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const headerBranchId = req.headers.get('x-branch-id');
    
    console.log('[API /api/sales] Iniciando POST - userId:', userId, 'headerBranchId:', headerBranchId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[API /api/sales] Body recibido:', JSON.stringify(body, null, 2));
    
    // Parseo y validación estricta con Zod
    const validatedData = saleSchema.parse(body);
    console.log('[API /api/sales] Datos validados correctamente');
    
    // Usar branchId del body si está disponible (para OWNER), sino del header
    // Filtrar strings vacíos también
    const branchId = validatedData.branchId || (headerBranchId && headerBranchId.trim() !== '' ? headerBranchId : null);
    
    console.log('[API /api/sales] branchId final:', branchId);
    
    if (!branchId) {
      return NextResponse.json({ error: 'No se pudo determinar la sucursal' }, { status: 401 });
    }

    // Delegamos toda la lógica al servicio
    const sale = await saleService.createSale({
      userId,
      branchId,
      ...validatedData
    });

    console.log('[API /api/sales] Venta creada exitosamente:', sale.code);

    // Convertir Decimals a números para el JSON
    const saleResponse = {
      ...sale,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      total: Number(sale.total),
      tenderedAmount: Number(sale.tenderedAmount),
      changeAmount: Number(sale.changeAmount),
      items: sale.items.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal)
      })),
      payments: sale.payments.map(p => ({
        ...p,
        amount: Number(p.amount)
      }))
    };

    return NextResponse.json(saleResponse, { status: 201 });

  } catch (error: unknown) {
    console.error('Error en API /api/sales:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.issues,
        message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      // Manejo de errores específicos del negocio lanzados por el servicio
      if (error.message.startsWith('STOCK_CONFLICT')) {
        const variantId = error.message.split(':')[1];
        return NextResponse.json({ error: 'Stock insuficiente', code: 'CONFLICT', variantId }, { status: 409 });
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
      
      // Error genérico con mensaje
      return NextResponse.json({ error: error.message || 'Error procesando la venta' }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}