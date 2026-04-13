import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { finalCash } = body;

    // Validación estricta del input
    if (finalCash === undefined || finalCash === null || isNaN(Number(finalCash))) {
      return NextResponse.json({ error: 'Monto final de caja inválido o faltante' }, { status: 400 });
    }

    // Convertir explícitamente a número
    const numericFinalCash = Number(finalCash);

    const session = await prisma.cashSession.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
        sales: {
          include: {
            items: {
              select: {
                productName: true,
                quantity: true,
                price: true,
                subtotal: true
              }
            },
            payments: {
              select: {
                method: true,
                amount: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.status !== 'OPEN') {
      return NextResponse.json({ error: 'Esta sesión ya está cerrada' }, { status: 400 });
    }

    // Calcular la diferencia asegurando que Prisma devuelva primitivos Number
    const income = Number(session.income || 0);
    const expense = Number(session.expense || 0);
    const difference = numericFinalCash - (income - expense);

    const updatedSession = await prisma.cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(), // Nota: Validar que esto use la hora de America/Lima si hay lógica intermedia
        finalCash: numericFinalCash,
        difference: difference
      },
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
        sales: {
          include: {
            items: {
              select: {
                productName: true,
                quantity: true,
                price: true,
                subtotal: true
              }
            },
            payments: {
              select: {
                method: true,
                amount: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error: unknown) {
    console.error('[CASH_SESSION_CLOSE_ERROR]', error);
    return NextResponse.json({ error: 'Error al cerrar la sesión' }, { status: 500 });
  }
}