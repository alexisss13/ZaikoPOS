import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Division } from '@prisma/client';

// GET se mantiene igual...
export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const branchId = req.headers.get('x-branch-id');
  const role = req.headers.get('x-user-role');

  if (!businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const firstBusiness = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
    const isPioneer = firstBusiness?.id === businessId;

    let branchFilter = {};
    if ((role === 'MANAGER' || role === 'CASHIER') && branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch?.ecommerceCode) {
        branchFilter = {
          category: { OR: [{ ecommerceCode: branch.ecommerceCode }, { ecommerceCode: null }] }
        };
      }
    }

    const products = await prisma.product.findMany({
      where: {
        AND: [
          { OR: [{ businessId: businessId }, ...(isPioneer ? [{ businessId: null }] : [])] },
          branchFilter
        ]
      },
      include: { 
        category: { select: { name: true, ecommerceCode: true } },
        branchStock: { select: { branchId: true, quantity: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await req.json();

    if (!body.title || !body.categoryId) {
      return NextResponse.json({ error: 'El título y la categoría son obligatorios' }, { status: 400 });
    }

    let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } });
    if (existingSlug) baseSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    const productDivision = category?.division || 'OTROS';

    // 🚀 1. Preparamos el array de sucursales
    const branchStockData = Object.entries(body.branchStocks || {}).map(([bId, qty]) => ({
      branchId: bId,
      quantity: parseInt(qty as string) || 0
    }));

    // 🚀 2. MAGIA: Sumamos automáticamente todo el stock físico para el E-commerce
    const calculatedWebStock = branchStockData.reduce((acc, curr) => acc + curr.quantity, 0);

    const newProduct = await prisma.product.create({
      data: {
        businessId,
        title: body.title,
        description: body.description || '',
        slug: baseSlug,
        categoryId: body.categoryId,
        division: productDivision as Division,
        images: body.image ? [body.image] : [],
        price: parseFloat(body.price || '0'),
        cost: body.cost ? parseFloat(body.cost) : null,
        wholesalePrice: body.wholesalePrice ? parseFloat(body.wholesalePrice) : null,
        wholesaleMinCount: body.wholesaleMinCount ? parseInt(body.wholesaleMinCount) : null,
        discountPercentage: body.discountPercentage ? parseInt(body.discountPercentage) : 0,
        
        stock: calculatedWebStock, // 👈 Se guarda la suma exacta
        minStock: body.minStock ? parseInt(body.minStock) : 5,
        
        barcode: body.barcode || null,
        code: body.code || null,
        color: body.color || null,
        groupTag: body.groupTag || null,
        tags: body.tags ? body.tags.split(',').map((t: string) => t.trim()) : [],
        isAvailable: body.isAvailable ?? true,
        active: body.active ?? true,
        branchStock: { create: branchStockData }
      }
    });

    return NextResponse.json(newProduct);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'El Código o Código de Barras ya existe.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno al crear producto' }, { status: 500 });
  }
}