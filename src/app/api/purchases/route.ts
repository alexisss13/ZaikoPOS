import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  // Solo OWNER y MANAGER pueden ver órdenes de compra
  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const purchases = await prisma.purchaseOrder.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { businessId: businessId || '' },
      include: {
        supplier: {
          select: {
            name: true,
          }
        },
        createdBy: {
          select: {
            name: true,
          }
        },
        items: {
          include: {
            variant: {
              select: {
                name: true,
                product: {
                  select: {
                    title: true,
                  }
                }
              }
            },
            uom: {
              select: {
                name: true,
                abbreviation: true,
              }
            }
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    });

    return NextResponse.json(purchases);
  } catch (error: unknown) {
    console.error('[PURCHASES_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener órdenes de compra' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');
  const userId = req.headers.get('x-user-id');

  // Solo OWNER y MANAGER pueden crear órdenes de compra
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    // Validar que haya items
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Debe agregar al menos un producto' }, { status: 400 });
    }

    // Calcular el total
    const totalAmount = body.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.cost);
    }, 0);

    const newPurchase = await prisma.purchaseOrder.create({
      data: {
        businessId,
        supplierId: body.supplierId || null,
        createdById: userId || null,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        notes: body.notes || null,
        totalAmount,
        items: {
          create: body.items.map((item: any) => ({
            variantId: item.variantId,
            uomId: item.uomId || null,
            quantity: item.quantity,
            cost: item.cost,
          }))
        }
      },
      include: {
        supplier: true,
        createdBy: {
          select: {
            name: true,
          }
        },
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            },
            uom: true
          }
        }
      }
    });

    return NextResponse.json(newPurchase);
  } catch (error: unknown) {
    console.error('[PURCHASES_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear orden de compra' }, { status: 500 });
  }
}
