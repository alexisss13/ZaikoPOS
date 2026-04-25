import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const account = await prisma.accountingAccount.findUnique({
      where: { id },
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
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && account.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Error al obtener cuenta' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const account = await prisma.accountingAccount.findUnique({
      where: { id }
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && account.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, type, parentId, isActive } = body;

    // If code is being changed, check uniqueness
    if (code && code !== account.code) {
      const existingAccount = await prisma.accountingAccount.findFirst({
        where: {
          businessId: account.businessId,
          code: code,
          id: { not: id }
        }
      });

      if (existingAccount) {
        return NextResponse.json({ 
          error: `El código ${code} ya existe para este negocio` 
        }, { status: 400 });
      }
    }

    // If parentId is being changed, verify it exists and belongs to same business
    if (parentId !== undefined && parentId !== account.parentId) {
      if (parentId) {
        const parentAccount = await prisma.accountingAccount.findFirst({
          where: {
            id: parentId,
            businessId: account.businessId
          }
        });

        if (!parentAccount) {
          return NextResponse.json({ 
            error: 'Cuenta padre no encontrada' 
          }, { status: 404 });
        }

        // Prevent circular reference (account cannot be its own parent)
        if (parentId === id) {
          return NextResponse.json({ 
            error: 'Una cuenta no puede ser su propia cuenta padre' 
          }, { status: 400 });
        }
      }
    }

    const updatedAccount = await prisma.accountingAccount.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(type && { type: type as AccountType }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        parent: {
          select: { id: true, code: true, name: true }
        },
        children: {
          select: { id: true, code: true, name: true }
        }
      }
    });

    return NextResponse.json(updatedAccount);
  } catch (error: unknown) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Error al actualizar cuenta' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');

  try {
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const account = await prisma.accountingAccount.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { journalLines: true }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && account.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if account has child accounts
    if (account.children.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar una cuenta con subcuentas. Elimine primero las subcuentas.' 
      }, { status: 400 });
    }

    // Check if account has journal entries
    if (account._count.journalLines > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar una cuenta con movimientos contables. Desactívela en su lugar.' 
      }, { status: 400 });
    }

    await prisma.accountingAccount.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error: unknown) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 });
  }
}
