// src/app/api/branches/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 🚀 NUEVO: Manejador GET agregado para evitar el error 405
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    
    const branch = await prisma.branch.findUnique({ 
      where: { id },
      include: { business: { select: { name: true } } }
    });
    
    if (!branch) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });

    // Seguridad: Si es dueño, solo puede ver sus propias sucursales
    if (role === 'OWNER' && branch.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado para ver esta sucursal' }, { status: 403 });
    }

    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error('[BRANCH_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener la sucursal' }, { status: 500 });
  }
}

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

    const updateData: Prisma.BranchUpdateInput = {
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      customRuc: body.customRuc || null,
      customLegalName: body.customLegalName || null,
      customAddress: body.customAddress || null,
      logos: body.logos ? body.logos : Prisma.DbNull,
      brandColors: body.brandColors ? body.brandColors : Prisma.DbNull,
    };

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
    console.error(error); 
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
    console.error(error); 
    return NextResponse.json({ error: 'Error al eliminar sucursal. Posibles dependencias activas.' }, { status: 500 });
  }
}