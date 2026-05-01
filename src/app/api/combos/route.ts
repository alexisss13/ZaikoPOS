import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userBranchId = req.headers.get('x-branch-id');

  console.log('[COMBOS_GET] Headers:', { businessId, role, userBranchId });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const active = searchParams.get('active');

    console.log('[COMBOS_GET] Params:', { page, limit, search, categoryId, active });

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      type: 'COMBO',
    };

    // Solo filtrar por active si se proporciona el parámetro
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    // Filtros de negocio y sucursal
    if (role !== 'SUPER_ADMIN') {
      if (businessId) {
        where.OR = [
          { businessId },
          { businessId: null }
        ];
      } else {
        // Si no hay businessId, solo devolver combos sin negocio asignado
        where.businessId = null;
      }
    }

    console.log('[COMBOS_GET] Where:', JSON.stringify(where, null, 2));

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [combos, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true }
          },
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
          variants: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              price: true,
              cost: true,
              images: true,
              stock: {
                select: {
                  branchId: true,
                  quantity: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      combos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[COMBOS_GET_ERROR]', error);
    console.error('[COMBOS_GET_ERROR] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Error al obtener combos', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');
  const userId = req.headers.get('x-user-id');

  let permissions: Record<string, boolean> = {};
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.permissions) permissions = user.permissions as Record<string, boolean>;
  }

  const canCreate = role === 'SUPER_ADMIN' || role === 'OWNER' || permissions.canCreateProducts;
  if (!canCreate) {
    return NextResponse.json({ error: 'No tienes permisos para crear combos' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, categoryId, basePrice, images, comboItems, branchStocks } = body;

    // Validaciones
    if (!title || !categoryId || !basePrice || !comboItems || comboItems.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Generar slug único
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Determinar branchOwnerId basado en la categoría
    let branchOwnerId = null;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { ecommerceCode: true }
    });
    
    if (category?.ecommerceCode) {
      const branch = await prisma.branch.findUnique({
        where: { ecommerceCode: category.ecommerceCode },
        select: { id: true }
      });
      branchOwnerId = branch?.id || null;
    }

    // Crear el combo
    const combo = await prisma.product.create({
      data: {
        title,
        description: description || '',
        slug,
        basePrice: parseFloat(basePrice),
        images: images || [],
        type: 'COMBO',
        categoryId,
        businessId,
        branchOwnerId,
        active: true,
        isAvailable: true,
        comboItems: {
          create: comboItems.map((item: any) => ({
            variantId: item.variantId,
            quantity: parseInt(item.quantity) || 1
          }))
        },
        variants: {
          create: {
            name: 'Combo',
            price: parseFloat(basePrice),
            cost: 0,
            minStock: 1,
            active: true,
            images: images || []
          }
        }
      },
      include: {
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

    // Crear stock inicial si se proporciona
    if (branchStocks && userId) {
      const comboVariant = combo.variants[0];
      if (comboVariant) {
        for (const [branchId, stockValue] of Object.entries(branchStocks as Record<string, string>)) {
          const quantity = parseInt(stockValue);
          
          if (quantity > 0) {
            await prisma.stock.create({
              data: {
                branchId,
                variantId: comboVariant.id,
                quantity
              }
            });

            // Registrar movimiento
            await prisma.stockMovement.create({
              data: {
                variantId: comboVariant.id,
                branchId,
                userId,
                type: 'INPUT',
                quantity,
                previousStock: 0,
                currentStock: quantity,
                reason: 'Stock inicial del combo',
              }
            });
          }
        }
      }
    }

    return NextResponse.json(combo, { status: 201 });
  } catch (error: any) {
    console.error('[COMBO_CREATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error al crear combo' }, { status: 500 });
  }
}