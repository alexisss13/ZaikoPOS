import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, ecommerceCode: true } },
        supplier: { select: { id: true, name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            active: true,
            images: true,
            attributes: true,
            uomId: true,
            uom: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
              }
            },
            stock: {
              select: {
                branchId: true,
                quantity: true,
              }
            }
          },
          where: { active: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (role !== 'SUPER_ADMIN' && product.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Agregar datos de la variante estándar al nivel del producto para facilitar la edición
    const standardVariant = product.variants.find(v => v.name === 'Estándar') || product.variants[0];
    
    const productWithVariantData = {
      ...product,
      sku: standardVariant?.sku || product.sku,
      barcode: standardVariant?.barcode || product.barcode,
      // Las imágenes: priorizar producto, luego variante
      images: product.images.length > 0 ? product.images : (standardVariant?.images || []),
    };

    return NextResponse.json(productWithVariantData);
  } catch (error) {
    console.error('[PRODUCT_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');
  const userBranchId = req.headers.get('x-branch-id');

  let permissions: Record<string, boolean> = {};
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.permissions) permissions = user.permissions as Record<string, boolean>;
  }

  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const canManageGlobal = isSuperOrOwner || permissions.canManageGlobalProducts;
  const canEdit = isSuperOrOwner || permissions.canEditProducts || canManageGlobal;

  if (!canEdit) return NextResponse.json({ error: 'Denegado. No tienes permiso para editar.' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();

    const product = await prisma.product.findUnique({ 
      where: { id }, 
      include: { 
        category: true,
        variants: true
      } 
    });
    
    if (!product || (product.businessId !== businessId && product.businessId !== null)) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Determinar branchOwnerId si cambió la categoría
    let branchOwnerId = product.branchOwnerId;
    if (body.categoryId && body.categoryId !== product.categoryId) {
      const newCategory = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { ecommerceCode: true }
      });
      
      if (newCategory?.ecommerceCode) {
        const branch = await prisma.branch.findUnique({
          where: { ecommerceCode: newCategory.ecommerceCode },
          select: { id: true }
        });
        branchOwnerId = branch?.id || null;
      } else {
        branchOwnerId = null;
      }
    }

    let finalSlug = product.slug;
    if (body.title && body.title !== product.title) {
      const formattedSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await prisma.product.findUnique({ where: { slug: formattedSlug } });
      finalSlug = existing ? `${formattedSlug}-${Math.random().toString(36).substring(2, 6)}` : formattedSlug;
    }

    // Asegurar que las imágenes se guarden correctamente
    const images = body.images !== undefined 
      ? (Array.isArray(body.images) ? body.images : []) 
      : product.images;

    // Para productos simples, consolidar wholesale price
    const wholesalePrice = body.wholesalePrice !== undefined 
      ? (body.wholesalePrice ? parseFloat(body.wholesalePrice) : null) 
      : product.wholesalePrice;
    
    const wholesaleMinCount = body.wholesaleMinCount !== undefined 
      ? (body.wholesaleMinCount ? parseInt(body.wholesaleMinCount) : null) 
      : product.wholesaleMinCount;

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: body.title || product.title,
        description: body.description ?? product.description,
        slug: finalSlug,
        categoryId: body.categoryId || product.categoryId,
        branchOwnerId,
        images,
        basePrice: body.basePrice !== undefined ? parseFloat(body.basePrice) : product.basePrice,
        cost: body.cost !== undefined ? parseFloat(body.cost) : product.cost,
        minStock: body.minStock !== undefined ? parseInt(body.minStock) : product.minStock,
        sku: body.sku !== undefined ? body.sku : product.sku,
        barcode: body.barcode !== undefined ? body.barcode : product.barcode,
        wholesalePrice,
        wholesaleMinCount,
        isAvailable: body.active !== undefined ? body.active : product.isAvailable,
        active: body.active !== undefined ? body.active : product.active,
        supplierId: body.supplierId !== undefined ? (body.supplierId || null) : product.supplierId,
      }
    });

    // Actualizar variantes si se proporcionaron
    if (body.variants && Array.isArray(body.variants)) {
      for (const variantData of body.variants) {
        // Buscar variante existente por ID o por nombre
        let existingVariant = null;
        if (variantData.id && variantData.id !== 'standard') {
          existingVariant = await prisma.productVariant.findUnique({
            where: { id: variantData.id }
          });
        } else {
          existingVariant = await prisma.productVariant.findFirst({
            where: { 
              productId: id, 
              name: variantData.name || 'Estándar'
            }
          });
        }

        const variantUpdateData = {
          name: variantData.name || 'Estándar',
          attributes: variantData.attributes || {},
          sku: variantData.sku || null,
          barcode: variantData.barcode || null,
          images: variantData.images || images,
          active: true
        };

        if (existingVariant) {
          // Actualizar variante existente
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: variantUpdateData
          });
        } else {
          // Crear nueva variante
          await prisma.productVariant.create({
            data: {
              ...variantUpdateData,
              productId: id
            }
          });
        }
      }
    } else {
      // Si no se enviaron variantes pero se actualizaron datos del producto simple,
      // actualizar la variante estándar con los nuevos datos
      const standardVariant = product.variants.find(v => v.name === 'Estándar') || product.variants[0];
      
      if (standardVariant) {
        await prisma.productVariant.update({
          where: { id: standardVariant.id },
          data: {
            images,
            sku: body.sku !== undefined ? body.sku : standardVariant.sku,
            barcode: body.barcode !== undefined ? body.barcode : standardVariant.barcode,
          }
        });
      }
    }

    // Manejar stock inicial si se proporciona
    if (body.branchStocks && userId) {
      for (const [variantKey, stockData] of Object.entries(body.branchStocks)) {
        if (typeof stockData === 'object' && stockData !== null) {
          // Buscar la variante correspondiente
          let variant = null;
          if (variantKey === 'standard' || variantKey === 'Estándar') {
            variant = await prisma.productVariant.findFirst({
              where: { productId: id, name: 'Estándar' }
            });
          } else {
            variant = await prisma.productVariant.findUnique({
              where: { id: variantKey }
            });
          }

          if (variant) {
            for (const [branchId, stockValue] of Object.entries(stockData as Record<string, string>)) {
              const quantity = parseInt(stockValue);
              
              if (quantity >= 0) {
                // Verificar si ya existe stock para esta variante y sucursal
                const existingStock = await prisma.stock.findUnique({
                  where: {
                    branchId_variantId: {
                      branchId,
                      variantId: variant.id
                    }
                  }
                });

                if (existingStock) {
                  // Actualizar stock existente
                  await prisma.stock.update({
                    where: { id: existingStock.id },
                    data: { quantity }
                  });
                } else if (quantity > 0) {
                  // Crear nuevo stock solo si la cantidad es mayor a 0
                  await prisma.stock.create({
                    data: {
                      branchId,
                      variantId: variant.id,
                      quantity
                    }
                  });

                  // Registrar movimiento de entrada
                  await prisma.stockMovement.create({
                    data: {
                      variantId: variant.id,
                      branchId,
                      userId,
                      type: 'INPUT',
                      quantity,
                      previousStock: 0,
                      currentStock: quantity,
                      reason: 'Stock inicial al editar producto',
                    }
                  });
                }
              }
            }
          }
        }
      }
    }

    // Obtener producto actualizado con todas las relaciones
    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        variants: {
          include: {
            stock: true
          }
        }
      }
    });

    return NextResponse.json(finalProduct);
  } catch (error: unknown) {
    console.error('[PRODUCT_UPDATE_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar producto';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  let permissions: Record<string, boolean> = {};
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.permissions) permissions = user.permissions as Record<string, boolean>;
  }

  const canEdit = role === 'SUPER_ADMIN' || role === 'OWNER' || permissions.canEditProducts;
  if (!canEdit) return NextResponse.json({ error: 'Denegado. No tienes permisos.' }, { status: 403 });

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || (product.businessId !== businessId && product.businessId !== null)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.product.update({
      where: { id },
      data: { active: false, isAvailable: false }
    });

    return NextResponse.json({ success: true, message: 'Producto desactivado correctamente' });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al desactivar el producto' }, { status: 500 });
  }
}