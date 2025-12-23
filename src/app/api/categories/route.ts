import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
});

export async function GET(req: Request) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      where: { businessId },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const businessId = req.headers.get('x-business-id');
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name } = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name,
        businessId
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error); // Mira la consola del servidor para ver el error real
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creando categoría' }, { status: 500 });
  }
}