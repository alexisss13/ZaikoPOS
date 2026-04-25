import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionSource } from '@prisma/client';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const branchId = searchParams.get('branchId');
  const source = searchParams.get('source') as TransactionSource | null;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
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
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (source) {
      where.source = source;
    }
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
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
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.journalEntry.count({ where })
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Error al obtener asientos contables' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const role = req.headers.get('x-user-role');
  const businessId = req.headers.get('x-business-id');
  const userId = req.headers.get('x-user-id');

  try {
    if (role !== 'SUPER_ADMIN' && role !== 'OWNER' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Validate businessId (empty string is treated as missing)
    if ((!businessId || businessId === '') && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    if (!userId || userId === '') {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { branchId, entryDate, description, lines, source, sourceId } = body;

    // Validation
    if (!branchId || !entryDate || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ 
        error: 'Sucursal, fecha y líneas son requeridos' 
      }, { status: 400 });
    }

    const targetBusinessId = role === 'SUPER_ADMIN' && body.businessId 
      ? body.businessId 
      : businessId;

    if (!targetBusinessId || targetBusinessId === '') {
      return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
    }

    // Verify branch belongs to business
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId: targetBusinessId
      }
    });

    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    // Calculate totals and validate double-entry
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (!line.accountId || (line.debit === undefined && line.credit === undefined)) {
        return NextResponse.json({ 
          error: 'Cada línea debe tener una cuenta y un débito o crédito' 
        }, { status: 400 });
      }

      const debit = parseFloat(line.debit || 0);
      const credit = parseFloat(line.credit || 0);

      if (debit < 0 || credit < 0) {
        return NextResponse.json({ 
          error: 'Los montos no pueden ser negativos' 
        }, { status: 400 });
      }

      if (debit > 0 && credit > 0) {
        return NextResponse.json({ 
          error: 'Una línea no puede tener débito y crédito al mismo tiempo' 
        }, { status: 400 });
      }

      totalDebit += debit;
      totalCredit += credit;

      // Verify account exists and belongs to business
      const account = await prisma.accountingAccount.findFirst({
        where: {
          id: line.accountId,
          businessId: targetBusinessId
        }
      });

      if (!account) {
        return NextResponse.json({ 
          error: `Cuenta ${line.accountId} no encontrada` 
        }, { status: 404 });
      }

      if (!account.isActive) {
        return NextResponse.json({ 
          error: `La cuenta ${account.code} - ${account.name} está inactiva` 
        }, { status: 400 });
      }
    }

    // Validate double-entry balance (debits must equal credits)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) { // Allow for small floating point errors
      return NextResponse.json({ 
        error: `El asiento no está balanceado. Débitos: ${totalDebit.toFixed(2)}, Créditos: ${totalCredit.toFixed(2)}` 
      }, { status: 400 });
    }

    // Generate sequential entry number for this business
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { businessId: targetBusinessId },
      orderBy: { entryNumber: 'desc' }
    });

    const entryNumber = (lastEntry?.entryNumber || 0) + 1;

    // Create journal entry with lines in a transaction
    const newEntry = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          businessId: targetBusinessId,
          branchId,
          entryNumber,
          entryDate: new Date(entryDate),
          description: description || null,
          source: source || 'MANUAL',
          sourceId: sourceId || null,
          createdById: userId,
          lines: {
            create: lines.map((line: any) => ({
              accountId: line.accountId,
              debit: parseFloat(line.debit || 0),
              credit: parseFloat(line.credit || 0),
              description: line.description || null
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

      // Update account balances
      for (const line of lines) {
        const debit = parseFloat(line.debit || 0);
        const credit = parseFloat(line.credit || 0);
        const netChange = debit - credit;

        await tx.accountingAccount.update({
          where: { id: line.accountId },
          data: {
            balance: {
              increment: netChange
            }
          }
        });
      }

      return entry;
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Error al crear asiento contable' }, { status: 500 });
  }
}
