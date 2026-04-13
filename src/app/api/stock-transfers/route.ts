import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fromBranchId, toBranchId, reason, items } = body;

    // Validaciones
    if (!fromBranchId || !toBranchId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json({ error: 'Las sucursales deben ser diferentes' }, { status: 400 });
    }

    // Obtener nombres de sucursales
    const [fromBranch, toBranch] = await Promise.all([
      prisma.branch.findUnique({ where: { id: fromBranchId }, select: { name: true } }),
      prisma.branch.findUnique({ where: { id: toBranchId }, select: { name: true } })
    ]);

    if (!fromBranch || !toBranch) {
      return NextResponse.json({ error: 'Sucursales no encontradas' }, { status: 404 });
    }

    // Crear el traslado con sus items
    const transfer = await prisma.stockTransfer.create({
      data: {
        fromBranchId,
        toBranchId,
        requestedById: userId,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { title: true }
                }
              }
            }
          }
        }
      }
    });

    // Crear notificaciones para managers de ambas sucursales y owners
    const targetUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ['SUPER_ADMIN', 'OWNER'] } },
          { role: 'MANAGER', branchId: fromBranchId },
          { role: 'MANAGER', branchId: toBranchId }
        ],
        isActive: true
      },
      select: { id: true, role: true, branchId: true }
    });

    const notificationsData = targetUsers.map(user => {
      let title = 'Nueva Solicitud de Traslado';
      let message = '';

      if (user.branchId === fromBranchId && user.role === 'MANAGER') {
        title = 'Solicitud de Traslado (Aprobación Requerida)';
        message = `${toBranch.name} solicita ${items.length} producto(s). Motivo: ${reason}`;
      } else if (user.branchId === toBranchId && user.role === 'MANAGER') {
        title = 'Traslado Solicitado';
        message = `Se solicitó traslado de ${items.length} producto(s) desde ${fromBranch.name}`;
      } else {
        title = 'Solicitud de Traslado';
        message = `${toBranch.name} solicitó traslado desde ${fromBranch.name} (${items.length} productos)`;
      }

      return {
        userId: user.id,
        title,
        message,
        type: 'TRANSFER_REQUEST' as const
      };
    });

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData
      });
    }

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('[STOCK_TRANSFER_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear traslado' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const branchId = req.headers.get('x-branch-id');
  const role = req.headers.get('x-user-role');

  try {
    let whereClause: any = {};
    
    // Si no es Owner o Super Admin, solo ve traslados de su sucursal
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
      if (branchId && branchId !== 'NONE') {
        whereClause = {
          OR: [{ fromBranchId: branchId }, { toBranchId: branchId }]
        };
      }
    }

    const transfers = await prisma.stockTransfer.findMany({
      where: whereClause,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        requestedBy: { select: { name: true } },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { title: true, images: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('[STOCK_TRANSFER_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener traslados' }, { status: 500 });
  }
}