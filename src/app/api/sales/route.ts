import { NextResponse } from 'next/server';
import { saleService } from '@/services/sale.service';
import { z } from 'zod';

// Esquema de Validación Estricto
const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(), // Precio enviado desde el front (seguridad: validar vs DB idealmente, MVP: confiamos)
  })).min(1, 'La venta debe tener al menos un producto'),
  payments: z.array(z.object({
    method: z.enum(['CASH', 'YAPE', 'PLIN', 'CARD', 'TRANSFER']),
    amount: z.number().positive(),
    reference: z.string().optional(),
  })).min(1, 'Debe haber al menos un método de pago'),
  customerId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Contexto de Seguridad
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id'); // Asumiendo que el middleware o el cliente lo envía

    if (!userId || !branchId) {
      return NextResponse.json({ error: 'Faltan credenciales o contexto de sucursal' }, { status: 401 });
    }

    // 2. Parseo de Body
    const body = await req.json();
    const validatedData = saleSchema.parse(body);

    // 3. Ejecución
    const sale = await saleService.createSale({
      userId,
      branchId,
      items: validatedData.items,
      payments: validatedData.payments,
      customerId: validatedData.customerId,
    });

    return NextResponse.json(sale, { status: 201 });

  } catch (error: unknown) {
    let status = 500;
    let message = 'Error al procesar la venta';

    if (error instanceof z.ZodError) {
      status = 400;
      message = error.issues[0]?.message || 'Datos inválidos';
    } else if (error instanceof Error) {
      message = error.message;
      // Errores de negocio específicos
      if (message.includes('Caja') || message.includes('Stock') || message.includes('coincide')) {
        status = 409; // Conflict
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}