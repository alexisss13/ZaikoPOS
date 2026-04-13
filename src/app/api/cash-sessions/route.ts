import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const branchId = req.headers.get('x-branch-id');
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    let whereClause: any = {};

    if (role === 'SUPER_ADMIN') {
      // Ver todas las sesiones
      whereClause = {};
    } else if (role === 'OWNER') {
      // Ver sesiones de su negocio
      whereClause = {
        branch: {
          businessId: businessId || ''
        }
      };
    } else if (role === 'MANAGER') {
      // Ver sesiones de su sucursal
      if (branchId && branchId !== 'NONE') {
        whereClause = { branchId };
      }
    }

    const sessions = await prisma.cashSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true
          }
        },
        branch: {
          select: {
            name: true
          }
        },
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
        },
        transactions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        openedAt: 'desc'
      },
      take: 50 // Limitar a las últimas 50 sesiones
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[CASH_SESSIONS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener sesiones de caja' }, { status: 500 });
  }
}
