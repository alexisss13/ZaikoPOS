import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const openSchema = z.object({
  initialCash: z.number().min(0)
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const branchId = req.headers.get('x-branch-id');
    if (!userId || !branchId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verificar si ya tiene una abierta
    const existing = await prisma.cashSession.findFirst({
        where: { userId, closedAt: null }
    });

    if (existing) {
        return NextResponse.json({ error: 'Ya tienes una caja abierta' }, { status: 400 });
    }

    const body = await req.json();
    const { initialCash } = openSchema.parse(body);

    const session = await prisma.cashSession.create({
        data: {
            userId,
            branchId,
            initialCash,
            status: 'OPEN',
            openedAt: new Date()
        }
    });

    return NextResponse.json(session);
  } catch (e) {
      return NextResponse.json({ error: 'Error abriendo caja' }, { status: 500 });
  }
}