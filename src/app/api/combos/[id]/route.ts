import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  try {
    const { id } = await params;
    
    const combo = await prisma.product.findUnique({
      where: { 
        id,
        type: 'COMBO'
      },
      include: {
        category: { select: { id: true, name: true, ecommerceCode: true } },
        comboItems: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, title: true, images: true }
                },
                stock: {
                  select: {
                    branchId: true,
                    quantity: true,
                  }
                }
              }
            }
          }
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            cost: true,
            minStock: true,
            active: true,
            images: true,
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

    if (!combo) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    if (role !== 'SUPER_ADMIN' && combo.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(combo);
  } catch (error) {
    console.error('[COMBO_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener combo' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  let permissions: Record<string, boolean> = {};
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.permissions) permissions = user.permissions as Record<string, boolean>;
  }

  const canEdit = role === 'SUPER_ADMIN' || role === 'OWNER' || permissions.canEditProducts;
  if (!canEdit) {
    return NextResponse.json({ error: 'No tienes permisos para editar combos' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const combo = await prisma.product.findUnique({ 
      where: { id, type: 'COMBO' }, 
      include: { comboItems: true, variants: true }
    });
    
    if (!combo || (combo.businessId !== businessId && combo.businessId !== null)) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    const { title, description, categoryId, basePrice, images, comboItems } = body;

    // Determinar branchOwnerId si cambió la categoría
    let branchOwnerId = combo.branchOwnerId;
    if (categoryId && categoryId !== combo.categoryId) {
      const newCategory = await prisma.category.findUnique({
        where: { id: categoryId },
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

    // Generar nuevo slug si cambió el título
    let finalSlug = combo.slug;
    if (title && title !== combo.title) {
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let slug = baseSlug;
      let counter = 1;
      
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      finalSlug = slug;
    }

    // Actualizar combo
    const updatedCombo = await prisma.product.update({
      where: { id },
      data: {
        title: title || combo.title,
        description: description ?? combo.description,
        slug: finalSlug,
        categoryId: categoryId || combo.categoryId,
        branchOwnerId,
        images: images !== undefined ? images : combo.images,
        basePrice: basePrice ? parseFloat(basePrice) : combo.basePrice,
        active: body.active !== undefined ? body.active : combo.active,
        isAvailable: body.active !== undefined ? body.active : combo.isAvailable,
      }
    });

    // Actualizar items del combo si se proporcionaron
    if (comboItems && Array.isArray(comboItems)) {
      // Eliminar items existentes
      await prisma.comboItem.deleteMany({
        where: { comboId: id }
      });

      // Crear nuevos items
      await prisma.comboItem.createMany({
        data: comboItems.map((item: any) => ({
          comboId: id,
          variantId: item.variantId,
          quantity: parseInt(item.quantity) || 1
        }))
      });
    }

    // Actualizar variante del combo
    const comboVariant = combo.variants.find(v => v.name === 'Combo');
    if (comboVariant && basePrice) {
      await prisma.productVariant.update({
        where: { id: comboVariant.id },
        data: {
          price: parseFloat(basePrice),
          images: images !== undefined ? images : comboVariant.images
        }
      });
    }

    // Obtener combo actualizado
    const finalCombo = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        comboItems: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, title: true, images: true }
                }
              }
            }
          }
        },
        variants: true
      }
    });

    return NextResponse.json(finalCombo);
  } catch (error: unknown) {
    console.error('[COMBO_UPDATE_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar combo';
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

  const canDelete = role === 'SUPER_ADMIN' || role === 'OWNER' || permissions.canEditProducts;
  if (!canDelete) {
    return NextResponse.json({ error: 'No tienes permisos para eliminar combos' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const combo = await prisma.product.findUnique({ 
      where: { id, type: 'COMBO' } 
    });
    
    if (!combo || (combo.businessId !== businessId && combo.businessId !== null)) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 403 });
    }

    await prisma.product.update({
      where: { id },
      data: { active: false, isAvailable: false }
    });

    return NextResponse.json({ success: true, message: 'Combo desactivado correctamente' });
  } catch (error: unknown) {
    console.error('[COMBO_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Error al desactivar el combo' }, { status: 500 });
  }
}