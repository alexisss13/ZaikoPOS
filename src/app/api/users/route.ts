import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    // 👑 TI ve a todos (y a qué negocio pertenecen)
    if (role === 'SUPER_ADMIN') {
      const allUsers = await prisma.user.findMany({
        include: { business: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(allUsers);
    }

    // 🏬 DUEÑOS/MANAGERS solo ven a su propia gente
    if (!businessId) throw new Error('Business ID es requerido');
    
    const businessUsers = await prisma.user.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(businessUsers);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const headerBusinessId = req.headers.get('x-business-id');

  // Solo Dueños y TI pueden crear usuarios (Managers no pueden contratar)
  if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado para contratar' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const targetBusinessId = role === 'SUPER_ADMIN' ? body.businessId : headerBusinessId;

    if (!targetBusinessId && body.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Se requiere un negocio para este usuario' }, { status: 400 });
    }

    // Verificar si el correo ya existe
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return NextResponse.json({ error: 'El correo ya está en uso' }, { status: 400 });

    // 🚀 VALIDACIÓN DE LÍMITES DE LICENCIA (Solo si no es un Super Admin)
    if (targetBusinessId && body.role !== 'SUPER_ADMIN') {
      const business = await prisma.business.findUnique({ where: { id: targetBusinessId } });
      if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

      // Contamos cuántos de este rol ya existen
      const currentRoleCount = await prisma.user.count({
        where: { businessId: targetBusinessId, role: body.role }
      });

      if (body.role === 'MANAGER' && currentRoleCount >= business.maxManagers) {
        return NextResponse.json({ error: `Límite de Jefes (${business.maxManagers}) alcanzado para tu licencia.` }, { status: 400 });
      }
      if (body.role === 'CASHIER' && currentRoleCount >= business.maxEmployees) {
        return NextResponse.json({ error: `Límite de Cajeros (${business.maxEmployees}) alcanzado para tu licencia.` }, { status: 400 });
      }
    }

    const hashedPassword = await hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role as Role,
        businessId: targetBusinessId || null,
        branchId: body.branchId || null
      },
      include: { business: { select: { name: true } } }
    });

    return NextResponse.json(newUser);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}