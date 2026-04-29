import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    // ⚡ Detectar si es para POS (necesita variants completas)
    const forPOS = searchParams.get('forPOS') === 'true';
    
    if (forPOS) {
      // 🔥 QUERY COMPLETA PARA POS - Incluye variants y stock
      const products = await prisma.product.findMany({
        where: role === 'SUPER_ADMIN' ? { active: true } : { businessId: businessId || '', active: true },
        select: {
          id: true,
          title: true,
          images: true,
          basePrice: true,
          wholesalePrice: true,
          wholesaleMinCount: true,
          discountPercentage: true,
          categoryId: true,
          category: { 
            select: { 
              name: true,
              ecommerceCode: true,
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
              cost: true,
              minStock: true,
              active: true,
              attributes: true,
              images: true,
              stock: {
                select: {
                  branchId: true,
                  quantity: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return NextResponse.json(products, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }
    
    // ⚡ OPTIMIZACIÓN AGRESIVA PARA DASHBOARD: Paginación + campos mínimos
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // 🔥 QUERY ULTRA OPTIMIZADA - Con campos necesarios para edición
    const products = await prisma.product.findMany({
      where: role === 'SUPER_ADMIN' ? { active: true } : { businessId: businessId || '', active: true },
      select: {
        id: true,
        title: true,
        slug: true,
        images: true,
        basePrice: true,
        wholesalePrice: true,
        wholesaleMinCount: true,
        active: true,
        branchOwnerId: true,
        categoryId: true,
        supplierId: true,
        category: { 
          select: { 
            id: true,
            name: true, 
          } 
        },
        supplier: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    // Obtener IDs de productos para queries separadas (más rápido)
    const productIds = products.map(p => p.id);
    
    // Query separada para variantes (más eficiente)
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: { in: productIds },
        active: true,
      },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        barcode: true,
        cost: true,
        minStock: true,
      },
      take: productIds.length, // Solo 1 por producto
    });
    
    // Query separada para stock (más eficiente)
    const variantIds = variants.map(v => v.id);
    const stocks = await prisma.stock.findMany({
      where: {
        variantId: { in: variantIds },
      },
      select: {
        variantId: true,
        branchId: true,
        quantity: true,
      },
    });
    
    // Mapear datos en memoria (rápido)
    const variantMap = new Map(variants.map(v => [v.productId, v]));
    const stockMap = new Map<string, { branchId: string; quantity: number }[]>();
    
    stocks.forEach(stock => {
      const existing = stockMap.get(stock.variantId) || [];
      existing.push({ branchId: stock.branchId, quantity: stock.quantity });
      stockMap.set(stock.variantId, existing);
    });
    
    // Transform the data
    const productsWithStocks = products.map(product => {
      const variant = variantMap.get(product.id);
      const variantStocks = variant ? (stockMap.get(variant.id) || []) : [];
      
      // Aggregate stock by branch
      const branchStocksMap = new Map<string, number>();
      variantStocks.forEach(stock => {
        const currentQty = branchStocksMap.get(stock.branchId) || 0;
        branchStocksMap.set(stock.branchId, currentQty + stock.quantity);
      });
      
      const branchStocks = Array.from(branchStocksMap.entries()).map(([branchId, quantity]) => ({
        branchId,
        quantity
      }));
      
      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        images: product.images.slice(0, 1),
        basePrice: product.basePrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinCount: product.wholesaleMinCount,
        active: product.active,
        branchOwnerId: product.branchOwnerId,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        category: product.category,
        supplier: product.supplier,
        branchStocks,
        minStock: variant?.minStock || 5,
        cost: variant?.cost || 0,
        barcode: variant?.barcode || null,
        sku: variant?.sku || null,
        code: variant?.barcode || variant?.sku || product.id.slice(0, 8),
        variants: variant ? [variant] : [], // Incluir la variante para el kardex
      };
    });
    
    // Contar total (query simple y rápida)
    const total = await prisma.product.count({
      where: role === 'SUPER_ADMIN' ? { active: true } : { businessId: businessId || '', active: true },
    });

    // ⚡ Agregar cache headers AGRESIVOS
    return NextResponse.json({
      products: productsWithStocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }, {
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