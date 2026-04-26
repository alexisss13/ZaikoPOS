import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  // Solo OWNER y MANAGER pueden ver proveedores
  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { businessId: businessId || '' },
      include: {
        _count: {
          select: {
            products: true,
            purchaseOrders: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(suppliers);
  } catch (error: unknown) {
    console.error('[SUPPLIERS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  // Solo OWNER y MANAGER pueden crear proveedores
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del proveedor es requerido' }, { status: 400 });
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        businessId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        ruc: body.ruc || null,
        address: body.address || null,
        representative: body.representative || null,
        website: body.website || null,
        comments: body.comments || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });

    return NextResponse.json(newSupplier);
  } catch (error: unknown) {
    console.error('[SUPPLIERS_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
