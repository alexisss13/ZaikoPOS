import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// 🚀 FIX: Eliminamos la importación de 'Division' que no se usaba

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');
  const userBranchId = req.headers.get('x-branch-id');

  // 🚀 1. VERIFICAR PERMISOS
  let permissions: Record<string, boolean> = {};
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.permissions) permissions = user.permissions as Record<string, boolean>;
  }

  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const canEdit = isSuperOrOwner || permissions.canEditProducts;
  const canManageGlobal = isSuperOrOwner || permissions.canManageGlobalProducts;
  const canViewCosts = isSuperOrOwner || permissions.canViewCosts;

  if (!canEdit) return NextResponse.json({ error: 'Denegado. No tienes permiso para editar.' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || (product.businessId !== businessId && product.businessId !== null)) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    let finalSlug = product.slug;
    if (body.title && body.title !== product.title) {
      const formattedSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await prisma.product.findUnique({ where: { slug: formattedSlug } });
      finalSlug = existing ? `${formattedSlug}-${Math.random().toString(36).substring(2, 6)}` : formattedSlug;
    }

    const category = body.categoryId ? await prisma.category.findUnique({ where: { id: body.categoryId } }) : null;
    const productDivision = category ? category.division : product.division;
    const finalImages = body.image ? [body.image] : product.images;

    // 🚀 3. ACTUALIZAR STOCK SEGURO
    if (body.branchStocks) {
      for (const [bId, qty] of Object.entries(body.branchStocks)) {
        // Si no es admin global, ignoramos cualquier ID que no sea su sucursal
        if (!canManageGlobal && bId !== userBranchId) continue;
        
        const parsedQty = parseInt(qty as string) || 0;
        await prisma.stock.upsert({
          where: { branchId_productId: { branchId: bId, productId: id } },
          update: { quantity: parsedQty },
          create: { branchId: bId, productId: id, quantity: parsedQty }
        });
      }
    }

    // 🚀 4. RECALCULAR STOCK WEB TOTAL (Sumando de la BD real para no perder data oculta)
    const allStocks = await prisma.stock.findMany({ where: { productId: id } });
    const calculatedWebStock = allStocks.reduce((acc, curr) => acc + curr.quantity, 0);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? product.description,
        slug: finalSlug,
        categoryId: body.categoryId || product.categoryId,
        division: productDivision, // 🚀 FIX: Ya no necesita "as Division"
        images: finalImages,
        price: body.price !== undefined ? parseFloat(body.price) : product.price,
        
        // 🚀 FIX: Protegemos el costo directamente aquí (Inline) para que TypeScript y Prisma no peleen por el tipo Decimal
        cost: canViewCosts && body.cost !== undefined 
          ? (body.cost ? parseFloat(body.cost) : null) 
          : product.cost,

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
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'El Código o Código de Barras ya existe.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  // 🚀 VERIFICACIÓN PARA DAR DE BAJA
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