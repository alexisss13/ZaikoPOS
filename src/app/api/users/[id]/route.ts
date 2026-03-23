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

    // Seguridad: Buscar al usuario a editar
    const userToEdit = await prisma.user.findUnique({ where: { id } });
    if (!userToEdit) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Regla: Un Owner no puede editar a usuarios de otro negocio ni a Super Admins
    if (userRole === 'OWNER') {
      if (userToEdit.businessId !== businessId || userToEdit.role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    // ✅ FIX 1: Tipamos el objeto en lugar de usar "any"
    const updateData: { name?: string; role?: Role; isActive?: boolean; password?: string } = {};
    
    if (body.name) updateData.name = body.name;
    if (body.role) updateData.role = body.role as Role;
    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    
    // Si envían contraseña, se hashea
    if (body.password && body.password.trim() !== '') {
      updateData.password = await hash(body.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { business: { select: { name: true } } }
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    // ✅ FIX 2: Usamos la variable para registrar el error en consola
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

    // Regla de negocio: Un OWNER solo puede borrar empleados de su negocio
    if (userRole === 'OWNER' && userToDelete.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // No se puede borrar al dueño supremo desde esta ruta (se borra junto con el negocio)
    if (userToDelete.role === 'OWNER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'El dueño principal no puede ser eliminado por aquí' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // ✅ FIX 2: Usamos la variable
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}