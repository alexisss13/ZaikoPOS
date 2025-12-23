import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/security';
import { z } from 'zod';
import { Role } from '@prisma/client';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

export async function POST(req: Request) {
  try {
    // Validar permisos (Solo OWNER o SUPER_ADMIN)
    const requesterRole = req.headers.get('x-user-role');
    const businessId = req.headers.get('x-business-id');

    if (requesterRole !== 'OWNER' && requesterRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!businessId) {
        return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    const body = await req.json();
    const data = createUserSchema.parse(body);

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        businessId: businessId,
      },
      select: { id: true, name: true, email: true, role: true } // No devolver password
    });

    return NextResponse.json(user);

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}