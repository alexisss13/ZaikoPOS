import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Definimos el tipo según la nueva convención de Next.js
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request,
  context: RouteContext // Los params ahora vienen en una Promise
) {
  try {
    // 🚀 FIX: Esperamos a que los params se resuelvan
    const { id } = await context.params;
    
    const body = await req.json();

    if (typeof body.read !== 'boolean') {
      return NextResponse.json({ error: 'El campo "read" es obligatorio' }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: body.read },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 });
  }
}