import { NextResponse } from 'next/server';
import { cashService } from '@/services/cash.service';
import { z } from 'zod';

const openSchema = z.object({
  branchId: z.string().uuid(),
  initialCash: z.number().min(0, 'El monto inicial no puede ser negativo'),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });

    const body = await req.json();
    const { branchId, initialCash } = openSchema.parse(body);

    const session = await cashService.openSession({ userId, branchId, initialCash });
    return NextResponse.json(session);

  } catch (error: unknown) {
    let status = 500;
    let message = 'Error al abrir caja';

    if (error instanceof z.ZodError) {
      status = 400;
      // SOLUCIÓN: Usamos .issues en lugar de .errors
      // TypeScript reconoce .issues perfectamente dentro del instanceof
      message = error.issues[0]?.message || 'Datos inválidos';
    } else if (error instanceof Error) {
      message = error.message;
      if (message.includes('ya existe') || message.includes('activa')) {
        status = 409; 
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}