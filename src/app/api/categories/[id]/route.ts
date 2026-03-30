import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Division } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    const body = await req.json();

    const category = await prisma.category.findUnique({ where: { id } });
    
    if (!category || (category.businessId !== businessId && category.businessId !== null)) {
      return NextResponse.json({ error: 'Categoría no encontrada o sin acceso' }, { status: 404 });
    }

    let finalSlug = category.slug;
    if (body.slug && body.slug !== category.slug) {
      const formattedSlug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await prisma.category.findUnique({ where: { slug: formattedSlug } });
      finalSlug = existing ? `${formattedSlug}-${Math.random().toString(36).substring(2, 6)}` : formattedSlug;
    }

    // 🚀 MAGIA DEL MAPEO PARA LA EDICIÓN
    let mappedDivision: Division = 'OTROS'; 
    if (body.ecommerceCode === 'JUGUETERIA') mappedDivision = 'JUGUETERIA';
    else if (body.ecommerceCode === 'FIESTAS') mappedDivision = 'FIESTAS';
    // Si no enviaron ecommerceCode (es undefined), mantenemos la división que ya tenía
    else if (body.ecommerceCode === undefined) mappedDivision = category.division;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: finalSlug,
        image: body.image !== undefined ? body.image : category.image,
        businessId: businessId, 
        ecommerceCode: body.ecommerceCode === 'NONE' ? null : body.ecommerceCode !== undefined ? body.ecommerceCode : category.ecommerceCode,
        division: mappedDivision, // 👈 Asignación inteligente
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // ... (El DELETE se queda exactamente igual) ...
  const businessId = req.headers.get('x-business-id');

  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    
    if (!category || (category.businessId !== businessId && category.businessId !== null)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const relatedProducts = await prisma.product.count({ where: { categoryId: id } });
    if (relatedProducts > 0) {
      return NextResponse.json({ error: 'No puedes eliminar una categoría que tiene productos asignados.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}