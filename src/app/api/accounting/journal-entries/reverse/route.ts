import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');
  const userId = req.headers.get('x-user-id');

  try {
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { entryId, reversalDate, description } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID requerido' }, { status: 400 });
    }

    // Fetch original entry
    const originalEntry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    if (!originalEntry) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    // Verify business access
    if (role !== 'SUPER_ADMIN' && originalEntry.businessId !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if entry is in a closed fiscal period
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        businessId: originalEntry.businessId,
        startDate: { lte: originalEntry.entryDate },
        endDate: { gte: originalEntry.entryDate },
        status: 'CLOSED'
      }
    });

    if (fiscalPeriod) {
      return NextResponse.json({ 
        error: 'No se puede revertir un asiento en un período fiscal cerrado' 
      }, { status: 400 });
    }

    // Generate sequential entry number for reversal
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { businessId: originalEntry.businessId },
      orderBy: { entryNumber: 'desc' }
    });

    const entryNumber = (lastEntry?.entryNumber || 0) + 1;

    // Create reversal entry with swapped debits/credits
    const reversalEntry = await prisma.$transaction(async (tx) => {
      const reversal = await tx.journalEntry.create({
        data: {
          businessId: originalEntry.businessId,
          branchId: originalEntry.branchId,
          entryNumber,
          entryDate: reversalDate ? new Date(reversalDate) : new Date(),
          description: description || `Reversión de asiento #${originalEntry.entryNumber}`,
          source: 'MANUAL',
          sourceId: null,
          createdById: userId,
          lines: {
            create: originalEntry.lines.map((line) => ({
              accountId: line.accountId,
              // Swap debit and credit
              debit: line.credit,
              credit: line.debit,
              description: line.description ? `Reversión: ${line.description}` : null
            }))
          }
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

      // Update account balances (reverse the original changes)
      for (const line of originalEntry.lines) {
        const netChange = Number(line.debit) - Number(line.credit);
        await tx.accountingAccount.update({
          where: { id: line.accountId },
          data: {
            balance: {
              decrement: netChange // Reverse the original change
            }
          }
        });
      }

      return reversal;
    });

    return NextResponse.json({
      message: 'Asiento revertido exitosamente',
      reversalEntry
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error reversing journal entry:', error);
    return NextResponse.json({ error: 'Error al revertir asiento' }, { status: 500 });
  }
}
