import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  // 🚀 FIX: Si tiene permisos globales, automáticamente tiene permiso de editar
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

      // 🚀 FIX: Validamos en BD si el producto tiene stock físico en MI tienda
      const hasStockInMyBranch = await prisma.stock.findFirst({
        where: { productId: id, branchId: userBranchId!, quantity: { gt: 0 } }
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
      for (const [bId, qty] of Object.entries(body.branchStocks)) {
        if (!canManageGlobal && bId !== userBranchId) continue;
        
        const parsedQty = parseInt(qty as string) || 0;
        await prisma.stock.upsert({
          where: { branchId_productId: { branchId: bId, productId: id } },
          update: { quantity: parsedQty },
          create: { branchId: bId, productId: id, quantity: parsedQty }
        });
      }
    }

    const allStocks = await prisma.stock.findMany({ where: { productId: id } });
    const calculatedWebStock = allStocks.reduce((acc, curr) => acc + curr.quantity, 0);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? product.description,
        slug: finalSlug,
        categoryId: body.categoryId || product.categoryId,
        images: body.image ? [body.image] : product.images,
        price: body.price !== undefined ? parseFloat(body.price) : product.price,
        
        cost: canViewCosts && body.cost !== undefined 
          ? (body.cost ? parseFloat(body.cost) : null) 
          : (product.cost ? Number(product.cost) : null),

        wholesalePrice: body.wholesalePrice !== undefined ? (body.wholesalePrice ? parseFloat(body.wholesalePrice) : null) : product.wholesalePrice,
        wholesaleMinCount: body.wholesaleMinCount !== undefined ? (body.wholesaleMinCount ? parseInt(body.wholesaleMinCount) : null) : product.wholesaleMinCount,
        discountPercentage: body.discountPercentage !== undefined ? parseInt(body.discountPercentage) : product.discountPercentage,
        stock: calculatedWebStock, 
        minStock: body.minStock !== undefined ? parseInt(body.minStock) : product.minStock,
        barcode: body.barcode !== undefined ? (body.barcode || null) : product.barcode,
        code: body.code !== undefined ? (body.code || null) : product.code,
        color: body.color !== undefined ? (body.color || null) : product.color,
        groupTag: body.groupTag !== undefined ? (body.groupTag || null) : product.groupTag,
        tags: body.tags !== undefined ? (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []) : product.tags,
        isAvailable: body.active !== undefined ? body.active : product.isAvailable,
        active: body.active !== undefined ? body.active : product.active,
      }
    });

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