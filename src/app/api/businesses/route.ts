import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');
  
  // SUPER_ADMIN puede ver todos los negocios
  if (role === 'SUPER_ADMIN') {
    try {
      const businesses = await prisma.business.findMany({
        include: {
          _count: { select: { branches: true, users: true } },
          users: { where: { role: 'OWNER' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(businesses);
    } catch (error: unknown) {
      return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 });
    }
  }
  
  // OWNER solo puede ver su propio negocio
  if (role === 'OWNER' && userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { business: true }
      });
      
      if (!user || !user.business) {
        return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
      }
      
      // Retornar como array para mantener consistencia con la respuesta de SUPER_ADMIN
      return NextResponse.json([user.business]);
    } catch (error: unknown) {
      return NextResponse.json({ error: 'Error al obtener negocio' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await req.json();
    
    const existingUser = await prisma.user.findUnique({ where: { email: body.ownerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo del dueño ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await hash(body.ownerPassword, 10);

    // Generar RUC si no se proporcionó
    const finalRuc = body.ruc && body.ruc.trim() !== '' 
      ? body.ruc.trim() 
      : `PENDING-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name: body.workspaceName,
          ruc: finalRuc,
          address: body.address || null,
          maxBranches: body.maxBranches || 1,
          maxManagers: body.maxManagers || 1,
          maxEmployees: body.maxEmployees || 3,
          brandColors: { primary: "#0f172a", secondary: "#3b82f6" }
        }
      });

      await tx.user.create({
        data: {
          name: body.ownerName,
          email: body.ownerEmail,
          password: hashedPassword,
          role: 'OWNER',
          businessId: newBusiness.id
        }
      });

      return newBusiness;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear negocio';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}