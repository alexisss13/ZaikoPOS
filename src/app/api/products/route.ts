import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    const products = await prisma.product.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { businessId: businessId || '' },
      include: { 
        category: { select: { name: true } },
        supplier: { select: { id: true, name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            cost: true,
            minStock: true,
            active: true,
            attributes: true,
            uomId: true,
            uom: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
              }
            }
          },
          where: { active: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('[PRODUCTS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    if (!body.title || !body.categoryId) {
      return NextResponse.json({ error: 'El título y la categoría son obligatorios' }, { status: 400 });
    }

    let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } });
    if (existingSlug) {
      baseSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Crear producto con variante por defecto
    const newProduct = await prisma.product.create({
      data: {
        businessId,
        title: body.title,
        description: body.description || '',
        slug: baseSlug,
        categoryId: body.categoryId,
        supplierId: body.supplierId || null,
        images: body.images || [],
        basePrice: body.basePrice ? parseFloat(body.basePrice) : 0,
        wholesalePrice: body.wholesalePrice ? parseFloat(body.wholesalePrice) : null,
        wholesaleMinCount: body.wholesaleMinCount ? parseInt(body.wholesaleMinCount) : null,
        discountPercentage: body.discountPercentage ? parseInt(body.discountPercentage) : 0,
        groupTag: body.groupTag || null,
        tags: body.tags ? body.tags.split(',').map((t: string) => t.trim()) : [],
        isAvailable: body.isAvailable ?? true,
        active: body.active ?? true,
        type: body.type || 'STANDARD',
        variants: {
          create: {
            name: 'Estándar',
            sku: body.sku || null,
            barcode: body.barcode || null,
            price: body.basePrice ? parseFloat(body.basePrice) : 0,
            cost: body.cost ? parseFloat(body.cost) : 0,
            minStock: body.minStock ? parseInt(body.minStock) : 5,
            active: true,
          }
        }
      },
      include: {
        category: true,
        supplier: true,
        variants: true,
      }
    });

    // Crear stock inicial y movimientos si se proporcionaron
    if (body.branchStocks && userId) {
      const variantId = newProduct.variants[0].id;
      
      for (const [branchId, stockValue] of Object.entries(body.branchStocks)) {
        const quantity = parseInt(stockValue as string);
        
        if (quantity > 0) {
          // Crear registro de stock
          await prisma.stock.create({
            data: {
              branchId,
              variantId,
              quantity,
            }
          });

          // Registrar movimiento de entrada
          await prisma.stockMovement.create({
            data: {
              variantId,
              branchId,
              userId,
              type: 'INPUT',
              quantity,
              previousStock: 0,
              currentStock: quantity,
              reason: 'Stock inicial al crear producto',
            }
          });
        }
      }
    }

    return NextResponse.json(newProduct);
  } catch (error: unknown) {
    console.error('[PRODUCTS_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}