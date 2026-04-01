import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, fromBranchId, toBranchId, requestedById, quantity } = body;

    // 1. Validaciones básicas
    if (!productId || !fromBranchId || !toBranchId || !requestedById || !quantity) {
      return NextResponse.json({ error: 'Faltan datos requeridos para el traslado' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a cero' }, { status: 400 });
    }

    // 2. Obtener nombres para construir mensajes amigables (Consultas en paralelo para mayor velocidad)
    const [product, fromBranch, toBranch, requester] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, select: { title: true } }),
      prisma.branch.findUnique({ where: { id: fromBranchId }, select: { name: true } }),
      prisma.branch.findUnique({ where: { id: toBranchId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: requestedById }, select: { name: true } })
    ]);

    if (!product || !fromBranch || !toBranch || !requester) {
      return NextResponse.json({ error: 'Registros de origen inválidos' }, { status: 400 });
    }

    // 3. Obtener a los usuarios que deben ser notificados
    // Dueños globales + Manager de tienda origen + Manager de tienda destino
    const targetUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ['SUPER_ADMIN', 'OWNER'] } },
          { role: 'MANAGER', branchId: fromBranchId },
          { role: 'MANAGER', branchId: toBranchId }
        ],
        isActive: true // Solo notificar a usuarios activos
      },
      select: { id: true, role: true, branchId: true }
    });

    // 4. Construir las notificaciones personalizadas según el rol/sucursal de cada usuario
    const notificationsData = targetUsers.map(user => {
      let title = 'Movimiento de Stock';
      let message = '';

      if (user.branchId === fromBranchId && user.role === 'MANAGER') {
        // Es el jefe de la tienda que TIENE el stock (Aprobador)
        title = 'Nueva Petición de Stock';
        message = `La tienda ${toBranch.name} solicita ${quantity}x "${product.title}". Solicitado por: ${requester.name}.`;
      } 
      else if (user.branchId === toBranchId && user.role === 'MANAGER') {
        // Es el jefe de la tienda que PIDE el stock (Solo informativo)
        title = 'Traslado Solicitado';
        message = `Tu cajero ${requester.name} solicitó ${quantity}x "${product.title}" a la tienda ${fromBranch.name}.`;
      } 
      else {
        // Es Dueño o Super Admin (Monitoreo global)
        title = 'Solicitud de Traslado (Global)';
        message = `${toBranch.name} solicitó ${quantity}x "${product.title}" a ${fromBranch.name} (Por: ${requester.name}).`;
      }

      return {
        userId: user.id, // Asignamos directamente al usuario
        title,
        message,
        type: 'TRANSFER_REQUEST' as const
      };
    });

    // 5. Transacción: Creamos el traslado y las notificaciones simultáneamente
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          productId,
          fromBranchId,
          toBranchId,
          requestedById,
          quantity: Number(quantity),
          status: 'PENDING'
        }
      });

      if (notificationsData.length > 0) {
        await tx.notification.createMany({
          data: notificationsData
        });
      }

      return transfer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creando traslado:', error);
    return NextResponse.json({ error: 'Error interno del servidor al crear traslado' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const role = searchParams.get('role');

    let whereClause = {};
    
    // Si NO es Super Admin o Dueño, solo ve los traslados que involucren a su sucursal
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
        product: { select: { title: true, images: true } },
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        requestedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error obteniendo traslados:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}