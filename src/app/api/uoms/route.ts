import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const uoms = await prisma.unitOfMeasure.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(uoms);
  } catch (error: unknown) {
    console.error('[UOMS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener unidades de medida' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');

  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!body.name || !body.abbreviation) {
      return NextResponse.json({ error: 'Nombre y abreviación son requeridos' }, { status: 400 });
    }

    const newUom = await prisma.unitOfMeasure.create({
      data: {
        name: body.name,
        abbreviation: body.abbreviation,
      }
    });

    return NextResponse.json(newUom);
  } catch (error: unknown) {
    console.error('[UOMS_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al crear unidad de medida' }, { status: 500 });
  }
}
