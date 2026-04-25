import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { createCashCloseJournalEntry } from '@/lib/accounting-integration';

const closeSchema = z.object({
  finalCash: z.number().min(0),
  comments: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { finalCash, comments } = closeSchema.parse(body);

    const session = await prisma.cashSession.findFirst({
      where: { userId, closedAt: null },
      include: { branch: true }
    });

    if (!session) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 404 });

    // CÁLCULO ARQUITECTÓNICAMENTE CORRECTO: Basado en el ID de la sesión, no en fechas.
    const salesAgg = await prisma.sale.aggregate({
      where: {
        cashSessionId: session.id, // <- El cambio clave
        status: 'COMPLETED'
      },
      _sum: { total: true }
    });

    const systemIncome = Number(salesAgg._sum.total || 0);
    const initial = Number(session.initialCash);
    
    const expectedCash = initial + systemIncome;
    const difference = finalCash - expectedCash; 

    // Cerrar Sesión (Las fechas en Prisma se guardan en UTC, se transforman a Lima en el cliente)
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

    // 🆕 CREAR ASIENTO CONTABLE AUTOMÁTICO
    try {
      await createCashCloseJournalEntry(closedSession.id);
      console.log('[CASH_CLOSE] Asiento contable creado automáticamente');
    } catch (accountingError) {
      console.error('[CASH_CLOSE] Error al crear asiento contable:', accountingError);
      // No fallar el cierre si falla la contabilidad
    }

    return NextResponse.json(closedSession);

  } catch (e) {
    console.error('[CASH_CLOSE_ERROR]', e);
    return NextResponse.json({ error: 'Error cerrando caja' }, { status: 500 });
  }
}