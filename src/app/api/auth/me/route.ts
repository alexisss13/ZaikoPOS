import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true, permissions: true, branchId: true, isActive: true }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Error al verificar sesión' }, { status: 500 });
  }
}