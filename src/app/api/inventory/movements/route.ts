import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const branchId = req.headers.get('x-branch-id');

  console.log('[INVENTORY_MOVEMENTS] Headers:', { businessId, role, branchId });

  try {
    // Obtener parámetros de query
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get('variantId');

    // Construir el filtro base
    const whereClause: any = {};

    // Filtrar por variantId si se proporciona
    if (variantId) {
      whereClause.variantId = variantId;
    }

    // Si no es SUPER_ADMIN, filtrar por businessId
    if (role !== 'SUPER_ADMIN') {
      // Obtener las sucursales del negocio
      const branches = await prisma.branch.findMany({
        where: { businessId: businessId || '' },
        select: { id: true }
      });
      
      console.log('[INVENTORY_MOVEMENTS] Found branches:', branches.length);
      
      const branchIds = branches.map(b => b.id);
      
      // Si el usuario tiene una sucursal específica y no puede ver otras, filtrar
      if (branchId && branchId !== 'NONE' && role !== 'OWNER' && role !== 'MANAGER') {
        whereClause.branchId = branchId;
      } else {
        // Mostrar todos los movimientos del negocio
        whereClause.branchId = { in: branchIds };
      }
    }

    console.log('[INVENTORY_MOVEMENTS] Where clause:', JSON.stringify(whereClause));

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        variant: {
          include: {
            product: {
              select: {
                title: true
              }
            }
          }
        },
        branch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 500 // Limitar a los últimos 500 movimientos
    });

    console.log('[INVENTORY_MOVEMENTS] Found movements:', movements.length);

    return NextResponse.json(movements);
  } catch (error: unknown) {
    console.error('[INVENTORY_MOVEMENTS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener movimientos de inventario' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');
  const branchId = req.headers.get('x-branch-id');

  // Solo OWNER, MANAGER y ADMIN pueden crear movimientos manuales
  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { variantId, type, quantity, reason, targetBranchId } = body;

    if (!variantId || !type || !quantity || !reason) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a 0' }, { status: 400 });
    }

    // Determinar la sucursal afectada
    const affectedBranchId = targetBranchId || branchId;

    if (!affectedBranchId || affectedBranchId === 'NONE') {
      return NextResponse.json({ error: 'Sucursal no especificada' }, { status: 400 });
    }

    // Obtener el stock actual
    const currentStock = await prisma.stock.findUnique({
      where: {
        branchId_variantId: {
          branchId: affectedBranchId,
          variantId: variantId
        }
      }
    });

    const previousStock = currentStock?.quantity || 0;
    let newStock = previousStock;

    // Calcular el nuevo stock según el tipo de movimiento
    if (type === 'INPUT') {
      newStock = previousStock + quantity;
    } else if (type === 'OUTPUT') {
      newStock = previousStock - quantity;
      if (newStock < 0) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
      }
    } else if (type === 'ADJUSTMENT') {
      // Para ajustes, la cantidad puede ser positiva o negativa
      newStock = quantity;
    }

    // Crear el movimiento en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar o crear el stock
      await tx.stock.upsert({
        where: {
          branchId_variantId: {
            branchId: affectedBranchId,
            variantId: variantId
          }
        },
        update: {
          quantity: newStock
        },
        create: {
          branchId: affectedBranchId,
          variantId: variantId,
          quantity: newStock
        }
      });

      // Registrar el movimiento
      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          branchId: affectedBranchId,
          userId: userId || '',
          type,
          quantity,
          previousStock,
          currentStock: newStock,
          reason
        },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  title: true
                }
              }
            }
          },
          branch: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      });

      return movement;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[INVENTORY_MOVEMENT_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear movimiento de inventario' }, { status: 500 });
  }
}
