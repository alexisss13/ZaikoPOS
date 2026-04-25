import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true }
            }
          }
        }
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && entry.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(entry);
  } catch (error: unknown) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json({ error: 'Error al obtener asiento' }, { status: 500 });
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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && entry.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if entry is in a closed fiscal period
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        businessId: entry.businessId,
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate },
        status: 'CLOSED'
      }
    });

    if (fiscalPeriod) {
      return NextResponse.json({ 
        error: 'No se puede modificar un asiento en un período fiscal cerrado' 
      }, { status: 400 });
    }

    const body = await req.json();
    const { description, entryDate } = body;

    // Only allow updating description and date, not the lines
    // To modify lines, user should reverse and create new entry
    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(entryDate && { entryDate: new Date(entryDate) })
      },
      include: {
        branch: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedEntry);
  } catch (error: unknown) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ error: 'Error al actualizar asiento' }, { status: 500 });
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
    // Only OWNER can delete journal entries
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && entry.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if entry is in a closed fiscal period
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        businessId: entry.businessId,
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate },
        status: 'CLOSED'
      }
    });

    if (fiscalPeriod) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un asiento en un período fiscal cerrado' 
      }, { status: 400 });
    }

    // Delete in transaction: reverse account balances and delete entry
    await prisma.$transaction(async (tx) => {
      // Reverse account balances
      for (const line of entry.lines) {
        const netChange = Number(line.debit) - Number(line.credit);
        await tx.accountingAccount.update({
          where: { id: line.accountId },
          data: {
            balance: {
              decrement: netChange
            }
          }
        });
      }

      // Delete lines first (due to foreign key)
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id }
      });

      // Delete entry
      await tx.journalEntry.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Asiento eliminado exitosamente' });
  } catch (error: unknown) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'Error al eliminar asiento' }, { status: 500 });
  }
}
