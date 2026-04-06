import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = await params;

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del proveedor es requerido' }, { status: 400 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        representative: body.representative || null,
        website: body.website || null,
        comments: body.comments || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });

    return NextResponse.json(updatedSupplier);
  } catch (error: unknown) {
    console.error('[SUPPLIER_PUT_ERROR]', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[SUPPLIER_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
