import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: Para Actualizar Límites o Cambiar el Estado (Activo/Suspendido)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    // 🚀 NEXT.JS 15: Desestructuramos la promesa con await
    const { id } = await params;
    const body = await req.json();
    
    // Si viene isActive, es una suspensión/activación
    if (typeof body.isActive === 'boolean') {
      const updated = await prisma.business.update({
        where: { id },
        data: { isActive: body.isActive }
      });
      return NextResponse.json(updated);
    }

    // Si no, es una actualización completa del negocio
    const updateData: any = {
      name: body.workspaceName,
      maxBranches: body.maxBranches,
      maxManagers: body.maxManagers,
      maxEmployees: body.maxEmployees,
    };

    // Permitir actualizar RUC y dirección
    if (body.ruc !== undefined) {
      updateData.ruc = body.ruc.trim() === '' ? null : body.ruc.trim();
    }
    if (body.address !== undefined) {
      updateData.address = body.address.trim() === '' ? null : body.address.trim();
    }

    const updated = await prisma.business.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE: Eliminación definitiva en cascada
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    // 🚀 NEXT.JS 15: Desestructuramos la promesa con await
    const { id } = await params;

    // Ejecutamos una transacción masiva para borrar toda la data del cliente y que no queden rastros "huérfanos"
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { businessId: id } }),
      prisma.sunatConfig.deleteMany({ where: { businessId: id } }),
      prisma.salePayment.deleteMany({ where: { sale: { businessId: id } } }),
      prisma.saleItem.deleteMany({ where: { sale: { businessId: id } } }),
      prisma.sale.deleteMany({ where: { businessId: id } }),
      prisma.cashSession.deleteMany({ where: { branch: { businessId: id } } }),
      prisma.stock.deleteMany({ where: { branch: { businessId: id } } }),
      prisma.product.deleteMany({ where: { businessId: id } }),
      prisma.category.deleteMany({ where: { businessId: id } }),
      prisma.customer.deleteMany({ where: { businessId: id } }),
      prisma.user.deleteMany({ where: { businessId: id } }),
      prisma.branch.deleteMany({ where: { businessId: id } }),
      prisma.business.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: 'Negocio eliminado definitivamente' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar el negocio (Posibles dependencias)' }, { status: 500 });
  }
}