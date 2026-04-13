import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, docType, docNumber, email, phone } = await req.json();

    if (!name || !docNumber) {
      return NextResponse.json({ error: 'Nombre y documento son requeridos' }, { status: 400 });
    }

    // Obtener el usuario para saber su businessId
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true }
    });

    if (!user?.businessId) {
      return NextResponse.json({ error: 'Usuario sin negocio asignado' }, { status: 400 });
    }

    // Verificar si ya existe un cliente con ese documento en el negocio
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        businessId_docNumber: {
          businessId: user.businessId,
          docNumber
        }
      }
    });

    if (existingCustomer) {
      return NextResponse.json({ error: 'Ya existe un cliente con ese número de documento' }, { status: 400 });
    }

    // Crear el cliente
    const customer = await prisma.customer.create({
      data: {
        businessId: user.businessId,
        name,
        docType,
        docNumber,
        email: email || null,
        phone: phone || null,
        pointsBalance: 0,
        totalSpent: 0,
        visits: 0
      }
    });

    return NextResponse.json(customer);

  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    // Obtener el usuario para saber su businessId
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true }
    });

    if (!user?.businessId) {
      return NextResponse.json({ error: 'Usuario sin negocio asignado' }, { status: 400 });
    }

    // Buscar clientes
    const customers = await prisma.customer.findMany({
      where: {
        businessId: user.businessId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { docNumber: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        } : {})
      },
      orderBy: { name: 'asc' },
      take: 50
    });

    return NextResponse.json(customers);

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}
