import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    // ⚡ OPTIMIZACIÓN: Query más ligera, solo campos necesarios
    const products = await prisma.product.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { businessId: businessId || '' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        images: true,
        basePrice: true,
        wholesalePrice: true,
        wholesaleMinCount: true,
        discountPercentage: true,
        groupTag: true,
        tags: true,
        isAvailable: true,
        active: true,
        type: true,
        branchOwnerId: true,
        categoryId: true,
        supplierId: true,
        createdAt: true,
        category: { 
          select: { 
            id: true,
            name: true, 
            ecommerceCode: true 
          } 
        },
        supplier: { 
          select: { 
            id: true, 
            name: true 
          } 
        },
        variants: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            minStock: true,
            stock: {
              select: {
                branchId: true,
                quantity: true,
              }
            }
          },
          take: 5, // Limitar variantes
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // REDUCIR a 200 productos máximo
    });
    
    // Transform the data to include branchStocks at product level
    const productsWithStocks = products.map(product => {
      // Aggregate stock from all variants
      const branchStocksMap = new Map<string, number>();
      
      product.variants.forEach(variant => {
        variant.stock.forEach(stock => {
          const currentQty = branchStocksMap.get(stock.branchId) || 0;
          branchStocksMap.set(stock.branchId, currentQty + stock.quantity);
        });
      });
      
      const branchStocks = Array.from(branchStocksMap.entries()).map(([branchId, quantity]) => ({
        branchId,
        quantity
      }));
      
      // Get data from the standard variant (or first variant)
      const standardVariant = product.variants.find(v => v.name === 'Estándar') || product.variants[0];
      const minStock = standardVariant?.minStock || 5;
      const barcode = standardVariant?.barcode || null;
      const sku = standardVariant?.sku || null;
      
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        slug: product.slug,
        images: product.images.slice(0, 1), // SOLO LA PRIMERA IMAGEN
        basePrice: product.basePrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinCount: product.wholesaleMinCount,
        discountPercentage: product.discountPercentage,
        groupTag: product.groupTag,
        tags: product.tags,
        isAvailable: product.isAvailable,
        active: product.active,
        type: product.type,
        branchOwnerId: product.branchOwnerId,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        createdAt: product.createdAt,
        category: product.category,
        supplier: product.supplier,
        branchStocks,
        minStock,
        barcode,
        sku,
        code: barcode || sku || product.id.slice(0, 8),
        variants: product.variants.slice(0, 3).map(v => ({ // SOLO 3 VARIANTES
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          minStock: v.minStock,
          stock: v.stock
        }))
      };
    });
    
    // ⚡ Agregar cache headers AGRESIVOS
    return NextResponse.json(productsWithStocks, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
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

    // Obtener la categoría para determinar el branchOwnerId
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId },
      select: { ecommerceCode: true }
    });

    // Buscar la sucursal dueña según el ecommerceCode de la categoría
    let branchOwnerId: string | null = null;
    if (category?.ecommerceCode) {
      const branch = await prisma.branch.findUnique({
        where: { ecommerceCode: category.ecommerceCode },
        select: { id: true }
      });
      branchOwnerId = branch?.id || null;
    }

    let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } });
    if (existingSlug) {
      baseSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Asegurar que las imágenes se guarden correctamente
    const images = Array.isArray(body.images) ? body.images : [];

    // Generar código de barras automáticamente si no se proporciona
    let barcode = body.barcode || null;
    if (!barcode) {
      // Generar un código de barras único basado en timestamp y random
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      barcode = `${timestamp}${random}`;
    }

    // Crear producto con variante por defecto
    const newProduct = await prisma.product.create({
      data: {
        businessId,
        branchOwnerId, // Asignar la sucursal dueña
        title: body.title,
        description: body.description || '',
        slug: baseSlug,
        categoryId: body.categoryId,
        supplierId: body.supplierId || null,
        images, // Guardar las imágenes
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
            barcode: barcode,
            price: body.basePrice ? parseFloat(body.basePrice) : 0,
            cost: body.cost ? parseFloat(body.cost) : 0,
            minStock: body.minStock ? parseInt(body.minStock) : 5,
            active: true,
            images, // También guardar las imágenes en la variante
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