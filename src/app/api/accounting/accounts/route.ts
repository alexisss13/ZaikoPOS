import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');
  const { searchParams } = new URL(req.url);
  
  const type = searchParams.get('type') as AccountType | null;
  const isActive = searchParams.get('isActive');
  const parentId = searchParams.get('parentId');

  try {
    // Only OWNER and MANAGER can access accounting
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Validate businessId (empty string is treated as missing)
    if ((!businessId || businessId === '') && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    const where: any = {};
    
    if (role !== 'SUPER_ADMIN' && businessId && businessId !== '') {
      where.businessId = businessId;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (parentId) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const accounts = await prisma.accountingAccount.findMany({
      where,
      include: {
        parent: {
          select: { id: true, code: true, name: true }
        },
        children: {
          select: { id: true, code: true, name: true, type: true, balance: true, isActive: true }
        },
        _count: {
          select: { journalLines: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(accounts);
  } catch (error: unknown) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Error al obtener cuentas contables' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    // Only OWNER and MANAGER can create accounts
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado para crear cuentas' }, { status: 403 });
    }

    // Validate businessId (empty string is treated as missing)
    if ((!businessId || businessId === '') && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { code, name, type, parentId } = body;

    // Validation
    if (!code || !name || !type) {
      return NextResponse.json({ 
        error: 'Código, nombre y tipo son requeridos' 
      }, { status: 400 });
    }

    const targetBusinessId = role === 'SUPER_ADMIN' && body.businessId 
      ? body.businessId 
      : businessId;

    if (!targetBusinessId || targetBusinessId === '') {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    // Check if code already exists for this business
    const existingAccount = await prisma.accountingAccount.findFirst({
      where: {
        businessId: targetBusinessId,
        code: code
      }
    });

    if (existingAccount) {
      return NextResponse.json({ 
        error: `El código ${code} ya existe para este negocio` 
      }, { status: 400 });
    }

    // If parentId is provided, verify it exists and belongs to same business
    if (parentId) {
      const parentAccount = await prisma.accountingAccount.findFirst({
        where: {
          id: parentId,
          businessId: targetBusinessId
        }
      });

      if (!parentAccount) {
        return NextResponse.json({ 
          error: 'Cuenta padre no encontrada' 
        }, { status: 404 });
      }
    }

    const newAccount = await prisma.accountingAccount.create({
      data: {
        businessId: targetBusinessId,
        code,
        name,
        type,
        parentId: parentId || null,
        balance: 0,
        isActive: true
      },
      include: {
        parent: {
          select: { id: true, code: true, name: true }
        }
      }
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Error al crear cuenta contable' }, { status: 500 });
  }
}
