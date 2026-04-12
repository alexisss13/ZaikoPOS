import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    if (role !== 'SUPER_ADMIN' && category.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Desactivar todos los productos de esta categoría
    const result = await prisma.product.updateMany({
      where: { categoryId: id },
      data: { 
        active: false,
        isAvailable: false
      }
    });

    return NextResponse.json({ 
      success: true, 
      deactivatedCount: result.count,
      message: `${result.count} producto(s) desactivado(s)`
    });
  } catch (error: unknown) {
    console.error('[CATEGORY_DEACTIVATE_PRODUCTS_ERROR]', error);
    return NextResponse.json({ error: 'Error al desactivar productos' }, { status: 500 });
  }
}
