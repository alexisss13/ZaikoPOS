import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logAudit } from '@/lib/audit'; // 👈 FIX 1: Importar logAudit

const closeSchema = z.object({
  finalCash: z.number().min(0),
  comments: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // 👈 FIX 2: Extraer 'comments' del parseo
    const { finalCash, comments } = closeSchema.parse(body);

    // 1. Obtener sesión abierta
    const session = await prisma.cashSession.findFirst({
        where: { userId, closedAt: null },
    });

    if (!session) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 404 });

    // 2. Calcular Totales del Sistema
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
    const difference = finalCash - expectedCash; 

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

    // 👈 FIX 3: Lógica de Auditoría Corregida
    // No buscamos closedSession.businessId porque no existe.
    // Buscamos el usuario para saber a qué negocio pertenece.
    const user = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { businessId: true } 
    });
    
    if (user?.businessId) {
        await logAudit({
            action: 'CLOSE_CASH',
            businessId: user.businessId,
            userId: userId,
            details: JSON.stringify({
                finalCash,
                difference: closedSession.difference,
                comments: comments || 'Sin comentarios'
            })
        });
    }

    return NextResponse.json(closedSession);

  } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Error cerrando caja' }, { status: 500 });
  }
}