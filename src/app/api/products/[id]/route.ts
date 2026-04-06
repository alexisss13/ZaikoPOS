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
            price: true,
            cost: true,
            minStock: true,
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
      sku: standardVariant?.sku,
      barcode: standardVariant?.barcode,
      cost: standardVariant?.cost,
      minStock: standardVariant?.minStock,
      // Las imágenes del producto tienen prioridad, si no hay, usar las de la variante
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
  const canViewCosts = isSuperOrOwner || permissions.canViewCosts;

  if (!canEdit) return NextResponse.json({ error: 'Denegado. No tienes permiso para editar.' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();

    const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!product || (product.businessId !== businessId && product.businessId !== null)) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (!isSuperOrOwner && !canManageGlobal) {
      const myBranch = userBranchId ? await prisma.branch.findUnique({ where: { id: userBranchId } }) : null;
      const isGlobalProduct = !product.category?.ecommerceCode;
      const isMyCatalogProduct = product.category?.ecommerceCode === myBranch?.ecommerceCode;

      // Verificar si tiene stock en mi sucursal a través de las variantes
      const hasStockInMyBranch = await prisma.stock.findFirst({
        where: { 
          branchId: userBranchId!,
          quantity: { gt: 0 },
          variant: { productId: id }
        }
      });

      if (!isGlobalProduct && !isMyCatalogProduct && !hasStockInMyBranch) {
        return NextResponse.json({ error: 'No tienes permiso de Catálogo Global para editar este producto de otra marca.' }, { status: 403 });
      }
    }

    let finalSlug = product.slug;
    if (body.title && body.title !== product.title) {
      const formattedSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await prisma.product.findUnique({ where: { slug: formattedSlug } });
      finalSlug = existing ? `${formattedSlug}-${Math.random().toString(36).substring(2, 6)}` : formattedSlug;
    }

    if (body.branchStocks) {
      // Los stocks ahora se manejan a nivel de variante, no de producto
      // Este código necesita ser actualizado cuando se implemente el sistema de variantes
      // Por ahora, se omite esta funcionalidad
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

    // Asegurar que las imágenes se guarden correctamente
    const images = body.images !== undefined 
      ? (Array.isArray(body.images) ? body.images : []) 
      : product.images;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? product.description,
        slug: finalSlug,
        categoryId: body.categoryId || product.categoryId,
        branchOwnerId,
        images,
        basePrice: body.basePrice !== undefined ? parseFloat(body.basePrice) : product.basePrice,
        
        wholesalePrice: body.wholesalePrice !== undefined ? (body.wholesalePrice ? parseFloat(body.wholesalePrice) : null) : product.wholesalePrice,
        wholesaleMinCount: body.wholesaleMinCount !== undefined ? (body.wholesaleMinCount ? parseInt(body.wholesaleMinCount) : null) : product.wholesaleMinCount,
        discountPercentage: body.discountPercentage !== undefined ? parseInt(body.discountPercentage) : product.discountPercentage,
        
        tags: body.tags !== undefined ? (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []) : product.tags,
        groupTag: body.groupTag !== undefined ? (body.groupTag || null) : product.groupTag,
        isAvailable: body.active !== undefined ? body.active : product.isAvailable,
        active: body.active !== undefined ? body.active : product.active,
        supplierId: body.supplierId || product.supplierId,
      },
      include: {
        category: true,
        supplier: true,
        variants: true,
      }
    });

    // Actualizar la variante estándar con los nuevos datos
    const standardVariant = await prisma.productVariant.findFirst({
      where: { productId: id, name: 'Estándar' }
    });

    if (standardVariant) {
      await prisma.productVariant.update({
        where: { id: standardVariant.id },
        data: {
          sku: body.sku !== undefined ? (body.sku || null) : standardVariant.sku,
          price: body.basePrice !== undefined ? parseFloat(body.basePrice) : standardVariant.price,
          cost: body.cost !== undefined ? parseFloat(body.cost) : standardVariant.cost,
          minStock: body.minStock !== undefined ? parseInt(body.minStock) : standardVariant.minStock,
          images,
        }
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
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