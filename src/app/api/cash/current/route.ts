import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Buscar última sesión del usuario que NO tenga fecha de cierre
  const session = await prisma.cashSession.findFirst({
    where: { 
        userId,
        closedAt: null // Importante: Solo abiertas
    },
    orderBy: { openedAt: 'desc' }
  });

  if (!session) return NextResponse.json({ session: null });

  return NextResponse.json({ 
      session: {
          id: session.id,
          status: 'OPEN',
          initialCash: Number(session.initialCash),
          openedAt: session.openedAt
      } 
  });
}