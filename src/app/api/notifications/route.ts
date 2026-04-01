import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // 🚀 FIX: Si no hay usuario, no devolvemos nada
    if (!userId) return NextResponse.json([]);

    const notifications = await prisma.notification.findMany({
      where: { userId }, // 🚀 FIX: Filtro estricto de privacidad
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}