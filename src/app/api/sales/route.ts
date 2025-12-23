import { NextResponse } from 'next/server';
import { saleService } from '@/services/sale.service';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const saleSchema = z.object({
  externalId: z.string().uuid().optional(), // <--- NUEVO
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
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
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id');

    if (!userId || !branchId) {
      return NextResponse.json({ error: 'Credenciales faltantes' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = saleSchema.parse(body);

    // Pasamos externalId al servicio (asegúrate de actualizar la interfaz en sale.service.ts también, 
    // pero por ahora Prisma lo aceptará si lo pasamos directo en el create data si actualizamos el tipo)
    // NOTA: Para no romper el servicio ahora, pasamos externalId como parte de la data
    // Si tu servicio es estricto con tipos, añade externalId?: string a CreateSaleParams
    
    const sale = await saleService.createSale({
      userId,
      branchId,
      ...validatedData,
      externalId: validatedData.externalId 
    });

    return NextResponse.json(sale, { status: 201 });

  } catch (error: unknown) {
    let status = 500;
    let message = 'Error al procesar la venta';

    // Manejo de errores Zod
    if (error instanceof z.ZodError) {
      status = 400;
      message = error.issues[0]?.message || 'Datos inválidos';
    } 
    // Manejo de errores Prisma (Idempotencia)
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed
      if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('externalId')) {
        // IDEMPOTENCIA: Si ya existe el externalId, devolvemos 200 OK fingiendo éxito
        return NextResponse.json({ message: 'Venta ya procesada previamente' }, { status: 200 });
      }
    }
    else if (error instanceof Error) {
      message = error.message;
      if (message.includes('Caja') || message.includes('Stock') || message.includes('coincide')) {
        status = 409;
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}