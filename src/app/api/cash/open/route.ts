// src/app/api/cash/open/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const openSchema = z.object({
  initialCash: z.number().min(0),
  branchId: z.string().optional() // Permitimos que el cliente envíe la sucursal
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const headerBranchId = req.headers.get('x-branch-id');
    
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { initialCash, branchId: bodyBranchId } = openSchema.parse(body);

    // Prioridad 1: Sucursal elegida en la UI (Dueños/Admins)
    // Prioridad 2: Sucursal inyectada por el middleware (Cajeros/Jefes)
    const finalBranchId = bodyBranchId || headerBranchId;

    if (!finalBranchId || finalBranchId === 'NONE') {
        return NextResponse.json({ error: 'No se pudo determinar la sucursal para abrir la caja. Por favor, selecciona una.' }, { status: 400 });
    }

    // Verificar si ya tiene una abierta en el sistema general
    const existing = await prisma.cashSession.findFirst({
        where: { userId, closedAt: null }
    });

    if (existing) {
        return NextResponse.json({ error: 'Ya tienes una caja abierta en otra sesión.' }, { status: 400 });
    }

    const session = await prisma.cashSession.create({
        data: {
            userId,
            branchId: finalBranchId,
            initialCash,
            status: 'OPEN',
            openedAt: new Date() // Zona horaria controlada en BD y mostrada en UI
        }
    });

    return NextResponse.json(session);
  } catch (e) {
      console.error('[CASH_OPEN_ERROR]', e);
      return NextResponse.json({ error: 'Error abriendo caja' }, { status: 500 });
  }
}