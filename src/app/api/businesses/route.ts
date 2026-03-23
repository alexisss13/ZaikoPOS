import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

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

    const result = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name: body.workspaceName,
          ruc: `PENDING-${Date.now()}`, 
          maxBranches: body.maxBranches || 1,
          maxManagers: body.maxManagers || 1,     // Nuevo: Límite Jefes por sucursal
          maxEmployees: body.maxEmployees || 3,   // Límite Cajeros por sucursal
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