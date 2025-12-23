import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = req.headers.get('x-branch-id') || searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID requerido' }, { status: 400 });
    }

    // Obtenemos productos que tengan registro de stock en esta sucursal
    // Opcional: Podrías traer todos los del business, pero filtrar por stock es más seguro
    const products = await prisma.product.findMany({
      where: {
        stock: {
          some: { branchId: branchId }
        }
      },
      include: {
        stock: {
          where: { branchId: branchId },
          select: { quantity: true }
        }
      }
    });

    // Aplanamos la respuesta para el frontend
    const formattedProducts = products.map(p => ({
      ...p,
      price: Number(p.price), // Decimal a Number
      stock: p.stock[0]?.quantity || 0
    }));

    return NextResponse.json(formattedProducts);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}