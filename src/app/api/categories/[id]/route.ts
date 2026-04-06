import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = params;

    if (!body.name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Verificar si el slug cambió y si ya existe
    let slug = body.slug 
      ? body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
      : body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: slug,
        image: body.image || null,
        ecommerceCode: body.ecommerceCode || null,
      },
      include: {
        _count: { select: { products: true } },
        business: { select: { name: true } }
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error: unknown) {
    console.error('[CATEGORY_PUT_ERROR]', error);
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;

    // Verificar si tiene productos asociados
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });

    if (category && category._count.products > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. Esta categoría tiene ${category._count.products} producto(s) asociado(s).` 
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[CATEGORY_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}
