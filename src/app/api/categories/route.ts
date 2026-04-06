import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    const categories = await prisma.category.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { businessId: businessId || '' },
      include: { 
        _count: { select: { products: true } },
        business: { select: { name: true } }
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error('[CATEGORIES_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    if (!body.name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    let baseSlug = body.slug 
      ? body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
      : body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const existing = await prisma.category.findUnique({ where: { slug: baseSlug } });
    if (existing) {
      baseSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const newCategory = await prisma.category.create({
      data: {
        name: body.name,
        slug: baseSlug,
        image: body.image || null,
        businessId: businessId,
        ecommerceCode: body.ecommerceCode || null,
      },
      include: {
        _count: { select: { products: true } },
        business: { select: { name: true } }
      }
    });

    return NextResponse.json(newCategory);
  } catch (error: unknown) {
    console.error('[CATEGORIES_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}