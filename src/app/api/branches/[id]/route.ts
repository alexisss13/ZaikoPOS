import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // 🚀 IMPORTANTE: Importamos los tipos oficiales de Prisma

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    const body = await req.json();

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });

    if (role === 'OWNER' && branch.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 🚀 Usamos el tipo oficial de Prisma. Así nunca habrá discrepancias.
    const updateData: Prisma.BranchUpdateInput = {
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      customRuc: body.customRuc || null,
      customLegalName: body.customLegalName || null,
      customAddress: body.customAddress || null,
      logoUrl: body.logoUrl || null,
      // 🚀 MAGIA PRISMA: Para vaciar un campo JSON, usamos Prisma.DbNull
      brandColors: body.brandColors ? body.brandColors : Prisma.DbNull,
    };

    // 🚀 REGLA DE NEGOCIO: Solo el TI puede modificar el código de vinculación E-commerce
    if (role === 'SUPER_ADMIN' && body.ecommerceCode !== undefined) {
      updateData.ecommerceCode = body.ecommerceCode 
        ? body.ecommerceCode.toUpperCase().trim().replace(/\s+/g, '_') 
        : null;
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedBranch);
  } catch (error: unknown) {
    console.error(error); // 🚀 Usamos el error para registrar posibles fallos en el servidor
    return NextResponse.json({ error: 'Error al actualizar sucursal' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });

    if (role === 'OWNER' && branch.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const relatedUsers = await prisma.user.count({ where: { branchId: id } });
    if (relatedUsers > 0) {
      return NextResponse.json({ error: 'No puedes eliminar una sucursal que tiene usuarios asignados. Reasígnalos primero.' }, { status: 400 });
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error); // Ya estaba aquí, ¡perfecto!
    return NextResponse.json({ error: 'Error al eliminar sucursal. Posibles dependencias activas.' }, { status: 500 });
  }
}