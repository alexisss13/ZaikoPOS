import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userRole = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    const body = await req.json();

    const userToEdit = await prisma.user.findUnique({ where: { id } });
    if (!userToEdit) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    if (userRole === 'OWNER') {
      if (userToEdit.businessId !== businessId || userToEdit.role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    // 🚀 FIX: Eliminamos el 'any' y usamos Record para el JSON de permisos
    const updateData: { 
      name?: string; 
      role?: Role; 
      isActive?: boolean; 
      password?: string;
      branchId?: string | null;
      permissions?: Record<string, boolean>; 
    } = {};
    
    if (body.name) updateData.name = body.name;
    if (body.role) updateData.role = body.role as Role;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    
    if (body.branchId !== undefined) {
      updateData.branchId = body.branchId === 'NONE' ? null : body.branchId;
    }
    if (body.permissions) {
      updateData.permissions = body.permissions;
    }
    
    if (body.password && body.password.trim() !== '') {
      updateData.password = await hash(body.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { business: { select: { name: true } }, branch: { select: { name: true } } }
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userRole = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    if (userRole === 'OWNER' && userToDelete.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (userToDelete.role === 'OWNER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'El dueño principal no puede ser eliminado por aquí' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    
    if (userToDelete.businessId) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_USER',
          details: `Se eliminó definitivamente al usuario: ${userToDelete.name || 'Sin Nombre'} (${userToDelete.email}) con rol de ${userToDelete.role}.`,
          businessId: userToDelete.businessId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}