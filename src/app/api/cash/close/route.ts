import { NextResponse } from 'next/server';
import { cashService } from '@/services/cash.service';
import { z } from 'zod';

const closeSchema = z.object({
  cashSessionId: z.string().uuid(),
  finalCash: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });

    const body = await req.json();
    const { cashSessionId, finalCash } = closeSchema.parse(body);

    const result = await cashService.closeSession({ userId, cashSessionId, finalCash });
    return NextResponse.json(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cerrar caja';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}