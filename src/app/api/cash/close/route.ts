import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const closeSchema = z.object({
  finalCash: z.number().min(0),
  comments: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { finalCash } = closeSchema.parse(body);

    // 1. Obtener sesión abierta
    const session = await prisma.cashSession.findFirst({
        where: { userId, closedAt: null },
        include: { sales: true } // Ojo: en un sistema grande, sumar con aggregate
    });

    if (!session) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 404 });

    // 2. Calcular Totales del Sistema
    // Sumamos ventas hechas por este usuario desde que abrió la caja
    const salesAgg = await prisma.sale.aggregate({
        where: {
            userId: userId,
            createdAt: { gte: session.openedAt }, // Desde que abrió
            status: 'COMPLETED'
        },
        _sum: { total: true }
    });

    const systemIncome = Number(salesAgg._sum.total || 0);
    const initial = Number(session.initialCash);
    
    // El sistema espera tener: Inicial + Ventas
    const expectedCash = initial + systemIncome;
    const difference = finalCash - expectedCash; // Positivo = Sobra, Negativo = Falta

    // 3. Cerrar Sesión
    const closedSession = await prisma.cashSession.update({
        where: { id: session.id },
        data: {
            closedAt: new Date(),
            finalCash,
            income: systemIncome,
            difference,
            status: 'CLOSED'
        }
    });

    return NextResponse.json(closedSession);

  } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Error cerrando caja' }, { status: 500 });
  }
}