import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UIProduct } from '@/types/product';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const search = searchParams.get('q') || '';
    const page = Number(searchParams.get('page')) || 1;
    const limit = 50; // Cargar de 50 en 50 para rendimiento

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID requerido' }, { status: 400 });
    }

    // Filtros dinámicos
    const whereClause = {
      stock: { some: { branchId } }, // Solo productos asociados a esta sucursal
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        },
        // Opcional: Ocultar productos sin stock en la búsqueda si lo deseas
        // { stock: { some: { branchId, quantity: { gt: 0 } } } } 
      ],
      active: true,
    };

    // Consulta transaccional (Total + Data)
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        // ... pagination ...
        include: {
          stock: { where: { branchId }, select: { quantity: true } },
          category: { select: { name: true } } // <-- INCLUIR CATEGORÍA
        },
        orderBy: { name: 'asc' },
      }),
  ]);

    // Transformación Decimal -> Number (DTO)
    const formattedProducts: UIProduct[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      code: p.code,
      minStock: p.minStock,
      stock: p.stock[0]?.quantity || 0,
      active: p.active,
      category: p.category?.name || 'General' // Mapear nombre
  }));

    return NextResponse.json({
      data: formattedProducts,
      metadata: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}