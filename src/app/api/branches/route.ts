import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    if (role === 'SUPER_ADMIN') {
      const allBranches = await prisma.branch.findMany({
        include: { 
          business: { select: { name: true, ruc: true } },
          _count: { select: { users: true } }
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(allBranches);
    }

    if (!businessId) throw new Error('Business ID requerido');
    
    const branches = await prisma.branch.findMany({
      where: { businessId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(branches);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al obtener sucursales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const headerBusinessId = req.headers.get('x-business-id');

  if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado para crear sucursales' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const targetBusinessId = role === 'SUPER_ADMIN' ? body.businessId : headerBusinessId;

    if (!targetBusinessId) return NextResponse.json({ error: 'Se requiere un negocio' }, { status: 400 });

    const business = await prisma.business.findUnique({ 
      where: { id: targetBusinessId },
      include: { _count: { select: { branches: true } } }
    });

    if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

    if (business._count.branches >= business.maxBranches) {
      return NextResponse.json({ 
        error: `Límite alcanzado. Tu licencia permite un máximo de ${business.maxBranches} sucursales.` 
      }, { status: 400 });
    }

    // 🚀 MAGIA: Si no enviaron código, usamos el nombre de la tienda en mayúsculas (y reemplazamos espacios por guiones bajos)
    let finalEcommerceCode = body.name.toUpperCase().trim().replace(/\s+/g, '_');
    
    // Si el TI mandó un código manual específico, usamos ese
    if (role === 'SUPER_ADMIN' && body.ecommerceCode && body.ecommerceCode.trim() !== '') {
      finalEcommerceCode = body.ecommerceCode.toUpperCase().trim().replace(/\s+/g, '_');
    }

    const newBranch = await prisma.branch.create({
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        businessId: targetBusinessId,
        customRuc: body.customRuc || null,
        customLegalName: body.customLegalName || null,
        customAddress: body.customAddress || null,
        logos: body.logos || null,
        brandColors: body.brandColors || null,
        ecommerceCode: finalEcommerceCode,
      } as any,
      include: { business: { select: { name: true } } }
    });

    return NextResponse.json(newBranch);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 });
  }
}