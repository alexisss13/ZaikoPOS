import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Division } from '@prisma/client';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const branchId = req.headers.get('x-branch-id');
  const role = req.headers.get('x-user-role');

  if (!businessId) {
    return NextResponse.json({ error: 'ID de negocio requerido' }, { status: 401 });
  }

  try {
    const firstBusiness = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
    const isPioneer = firstBusiness?.id === businessId;

    let branchFilter = {};
    if ((role === 'MANAGER' || role === 'CASHIER') && branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch?.ecommerceCode) {
        branchFilter = {
          OR: [
            { ecommerceCode: branch.ecommerceCode },
            { ecommerceCode: null }
          ]
        };
      }
    }

    const categories = await prisma.category.findMany({
      where: {
        AND: [
          {
            OR: [
              { businessId: businessId },
              ...(isPioneer ? [{ businessId: null }] : [])
            ]
          },
          branchFilter
        ]
      },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  if (!businessId || (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });

    let baseSlug = body.slug 
      ? body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
      : body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const existing = await prisma.category.findUnique({ where: { slug: baseSlug } });
    if (existing) {
      baseSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 🚀 MAGIA DEL MAPEO: Protegemos al E-commerce
    let mappedDivision: Division = 'OTROS'; 
    if (body.ecommerceCode === 'JUGUETERIA') mappedDivision = 'JUGUETERIA';
    if (body.ecommerceCode === 'FIESTAS') mappedDivision = 'FIESTAS';

    const newCategory = await prisma.category.create({
      data: {
        name: body.name,
        slug: baseSlug,
        image: body.image || null,
        businessId: businessId,
        ecommerceCode: body.ecommerceCode === 'NONE' ? null : body.ecommerceCode,
        division: mappedDivision, // 👈 Asignación inteligente
      }
    });

    return NextResponse.json(newCategory);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}