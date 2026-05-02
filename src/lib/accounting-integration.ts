/**
 * Funciones de integración automática con el módulo de contabilidad
 * Crea asientos contables automáticamente desde otros módulos
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Obtiene el siguiente número de asiento para un negocio
 */
async function getNextEntryNumber(businessId: string): Promise<number> {
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { businessId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true }
  });
  
  return (lastEntry?.entryNumber || 0) + 1;
}

/**
 * Obtiene o crea una cuenta contable por código
 */
async function getOrCreateAccount(
  businessId: string,
  code: string,
  name: string,
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
) {
  let account = await prisma.accountingAccount.findFirst({
    where: { businessId, code }
  });

  if (!account) {
    account = await prisma.accountingAccount.create({
      data: {
        businessId,
        code,
        name,
        type,
        balance: 0,
        isActive: true
      }
    });
  }

  return account;
}

/**
 * Actualiza los saldos de las cuentas basado en las líneas del asiento
 */
async function updateAccountBalances(lines: any[]) {
  for (const line of lines) {
    const netChange = Number(line.debit || 0) - Number(line.credit || 0);
    
    await prisma.accountingAccount.update({
      where: { id: line.accountId },
      data: {
        balance: {
          increment: netChange
        }
      }
    });
  }
}

// ==========================================
// INTEGRACIÓN CON VENTAS
// ==========================================

/**
 * Crea asientos contables automáticos para una venta
 */
export async function createSaleJournalEntries(saleId: string) {
  try {
    // Obtener la venta con todos sus datos
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        payments: true,
        items: {
          include: {
            variant: {
              select: {
                product: {
                  select: {
                    cost: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!sale || !sale.businessId) {
      console.error('Sale not found or missing businessId:', saleId);
      return;
    }

    // Obtener o crear cuentas necesarias
    const salesAccount = await getOrCreateAccount(
      sale.businessId,
      '401',
      'Ventas',
      'REVENUE'
    );

    const costAccount = await getOrCreateAccount(
      sale.businessId,
      '501',
      'Costo de Ventas',
      'EXPENSE'
    );

    const inventoryAccount = await getOrCreateAccount(
      sale.businessId,
      '104',
      'Inventario',
      'ASSET'
    );

    // Obtener número de asiento
    const entryNumber = await getNextEntryNumber(sale.businessId);

    // Preparar líneas del asiento de venta
    const saleLines: Prisma.JournalEntryLineCreateManyJournalEntryInput[] = [];

    // Agrupar pagos por método
    const paymentsByMethod = new Map<string, number>();
    for (const payment of sale.payments) {
      const current = paymentsByMethod.get(payment.method) || 0;
      paymentsByMethod.set(payment.method, current + Number(payment.amount));
    }

    // Crear débitos por cada método de pago
    for (const [method, amount] of paymentsByMethod) {
      let accountCode = '101'; // Caja General por defecto
      let accountName = 'Caja General';

      switch (method) {
        case 'CARD':
          accountCode = '102';
          accountName = 'Banco - Tarjetas';
          break;
        case 'YAPE':
        case 'PLIN':
          accountCode = '103';
          accountName = 'Banco - Yape/Plin';
          break;
        case 'TRANSFER':
          accountCode = '105';
          accountName = 'Banco - Transferencias';
          break;
      }

      const paymentAccount = await getOrCreateAccount(
        sale.businessId,
        accountCode,
        accountName,
        'ASSET'
      );

      saleLines.push({
        accountId: paymentAccount.id,
        debit: amount,
        credit: 0,
        description: `Pago ${method}`
      });
    }

    // Crédito a ventas
    saleLines.push({
      accountId: salesAccount.id,
      debit: 0,
      credit: Number(sale.total),
      description: 'Venta de productos'
    });

    // Crear asiento de venta
    const saleEntry = await prisma.journalEntry.create({
      data: {
        businessId: sale.businessId,
        branchId: sale.branchId,
        entryNumber,
        entryDate: sale.createdAt,
        description: `Venta ${sale.code}`,
        source: 'SALE',
        sourceId: sale.id,
        createdById: sale.userId,
        lines: {
          create: saleLines
        }
      }
    });

    // Actualizar saldos
    await updateAccountBalances(saleLines);

    // Crear asiento de costo si hay items con costo
    let totalCost = 0;
    for (const item of sale.items) {
      if (item.variant?.product?.cost) {
        totalCost += Number(item.variant.product.cost) * item.quantity;
      }
    }

    if (totalCost > 0) {
      const costEntryNumber = await getNextEntryNumber(sale.businessId);
      const costLines: Prisma.JournalEntryLineCreateManyJournalEntryInput[] = [
        {
          accountId: costAccount.id,
          debit: totalCost,
          credit: 0,
          description: 'Costo de mercadería vendida'
        },
        {
          accountId: inventoryAccount.id,
          debit: 0,
          credit: totalCost,
          description: 'Salida de inventario'
        }
      ];

      await prisma.journalEntry.create({
        data: {
          businessId: sale.businessId,
          branchId: sale.branchId,
          entryNumber: costEntryNumber,
          entryDate: sale.createdAt,
          description: `Costo de Venta ${sale.code}`,
          source: 'SALE',
          sourceId: sale.id,
          createdById: sale.userId,
          lines: {
            create: costLines
          }
        }
      });

      await updateAccountBalances(costLines);
    }

    console.log(`✅ Asientos contables creados para venta ${sale.code}`);
    return saleEntry;
  } catch (error) {
    console.error('Error creating sale journal entries:', error);
    throw error;
  }
}

// ==========================================
// INTEGRACIÓN CON COMPRAS
// ==========================================

/**
 * Crea asiento contable automático para una compra recibida
 */
export async function createPurchaseJournalEntry(purchaseId: string) {
  try {
    const purchase = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        createdBy: {
          select: {
            branchId: true
          }
        }
      }
    });

    if (!purchase || !purchase.businessId) {
      console.error('Purchase not found or missing businessId:', purchaseId);
      return;
    }

    // Obtener o crear cuentas
    const inventoryAccount = await getOrCreateAccount(
      purchase.businessId,
      '104',
      'Inventario',
      'ASSET'
    );

    const payableAccount = await getOrCreateAccount(
      purchase.businessId,
      '201',
      'Cuentas por Pagar',
      'LIABILITY'
    );

    const entryNumber = await getNextEntryNumber(purchase.businessId);

    const lines: Prisma.JournalEntryLineCreateManyJournalEntryInput[] = [
      {
        accountId: inventoryAccount.id,
        debit: Number(purchase.totalAmount),
        credit: 0,
        description: 'Compra de inventario'
      },
      {
        accountId: payableAccount.id,
        debit: 0,
        credit: Number(purchase.totalAmount),
        description: `Deuda a ${purchase.supplier?.name || 'proveedor'}`
      }
    ];

    const entry = await prisma.journalEntry.create({
      data: {
        businessId: purchase.businessId,
        branchId: purchase.createdBy?.branchId || purchase.businessId, // Fallback
        entryNumber,
        entryDate: purchase.receivedDate || purchase.orderDate,
        description: `Compra a ${purchase.supplier?.name || 'proveedor'}`,
        source: 'PURCHASE',
        sourceId: purchase.id,
        createdById: purchase.createdById || 'system',
        lines: {
          create: lines
        }
      }
    });

    await updateAccountBalances(lines);

    console.log(`✅ Asiento contable creado para compra ${purchase.id}`);
    return entry;
  } catch (error) {
    console.error('Error creating purchase journal entry:', error);
    throw error;
  }
}

// ==========================================
// INTEGRACIÓN CON CAJA
// ==========================================

/**
 * Crea asiento contable para apertura de caja
 */
export async function createCashOpenJournalEntry(sessionId: string) {
  try {
    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        branch: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!session || !session.branch?.businessId) {
      console.error('Session not found or missing businessId:', sessionId);
      return;
    }

    const businessId = session.branch.businessId;

    // Obtener o crear cuentas
    const cashAccount = await getOrCreateAccount(
      businessId,
      '101',
      'Caja General',
      'ASSET'
    );

    const fundAccount = await getOrCreateAccount(
      businessId,
      '106',
      'Fondo de Caja',
      'ASSET'
    );

    const entryNumber = await getNextEntryNumber(businessId);

    const lines: Prisma.JournalEntryLineCreateManyJournalEntryInput[] = [
      {
        accountId: cashAccount.id,
        debit: Number(session.initialCash),
        credit: 0,
        description: 'Fondo inicial de caja'
      },
      {
        accountId: fundAccount.id,
        debit: 0,
        credit: Number(session.initialCash),
        description: 'Asignación de fondo'
      }
    ];

    const entry = await prisma.journalEntry.create({
      data: {
        businessId,
        branchId: session.branchId,
        entryNumber,
        entryDate: session.openedAt,
        description: 'Apertura de Caja',
        source: 'CASH_SESSION',
        sourceId: session.id,
        createdById: session.userId,
        lines: {
          create: lines
        }
      }
    });

    await updateAccountBalances(lines);

    console.log(`✅ Asiento contable creado para apertura de caja ${session.id}`);
    return entry;
  } catch (error) {
    console.error('Error creating cash open journal entry:', error);
    throw error;
  }
}

/**
 * Crea asiento contable para cierre de caja
 */
export async function createCashCloseJournalEntry(sessionId: string) {
  try {
    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        branch: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!session || !session.branch?.businessId || !session.closedAt) {
      console.error('Session not found, missing businessId, or not closed:', sessionId);
      return;
    }

    const businessId = session.branch.businessId;

    // Obtener o crear cuentas
    const cashAccount = await getOrCreateAccount(
      businessId,
      '101',
      'Caja General',
      'ASSET'
    );

    const fundAccount = await getOrCreateAccount(
      businessId,
      '106',
      'Fondo de Caja',
      'ASSET'
    );

    const entryNumber = await getNextEntryNumber(businessId);

    const lines: Prisma.JournalEntryLineCreateManyJournalEntryInput[] = [
      {
        accountId: fundAccount.id,
        debit: Number(session.initialCash),
        credit: 0,
        description: 'Devolución de fondo'
      },
      {
        accountId: cashAccount.id,
        debit: 0,
        credit: Number(session.initialCash),
        description: 'Retiro de fondo inicial'
      }
    ];

    const entry = await prisma.journalEntry.create({
      data: {
        businessId,
        branchId: session.branchId,
        entryNumber,
        entryDate: session.closedAt,
        description: 'Cierre de Caja',
        source: 'CASH_SESSION',
        sourceId: session.id,
        createdById: session.userId,
        lines: {
          create: lines
        }
      }
    });

    await updateAccountBalances(lines);

    console.log(`✅ Asiento contable creado para cierre de caja ${session.id}`);
    return entry;
  } catch (error) {
    console.error('Error creating cash close journal entry:', error);
    throw error;
  }
}

// ==========================================
// INTEGRACIÓN CON INVENTARIO
// ==========================================

/**
 * Crea asiento contable para ajuste de inventario
 */
export async function createInventoryAdjustmentJournalEntry(movementId: string) {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: movementId },
      include: {
        variant: {
          select: {
            product: {
              select: {
                cost: true,
                businessId: true
              }
            }
          }
        },
        branch: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!movement || movement.type !== 'ADJUSTMENT') {
      return; // Solo crear asientos para ajustes
    }

    const businessId = movement.branch?.businessId || movement.variant?.product?.businessId;
    
    if (!businessId) {
      console.error('Cannot determine businessId for movement:', movementId);
      return;
    }

    // Calcular valor del ajuste
    const cost = Number(movement.variant?.product?.cost || 0);
    const adjustmentValue = Math.abs(movement.quantity) * cost;

    if (adjustmentValue === 0) {
      return; // No crear asiento si no hay valor
    }

    // Obtener o crear cuentas
    const inventoryAccount = await getOrCreateAccount(
      businessId,
      '104',
      'Inventario',
      'ASSET'
    );

    const lossAccount = await getOrCreateAccount(
      businessId,
      '502',
      'Pérdida por Ajustes',
      'EXPENSE'
    );

    const gainAccount = await getOrCreateAccount(
      businessId,
      '402',
      'Ganancia por Ajustes',
      'REVENUE'
    );

    const entryNumber = await getNextEntryNumber(businessId);

    let lines: Prisma.JournalEntryLineCreateManyJournalEntryInput[];

    if (movement.quantity < 0) {
      // Ajuste negativo (pérdida)
      lines = [
        {
          accountId: lossAccount.id,
          debit: adjustmentValue,
          credit: 0,
          description: movement.reason || 'Ajuste de inventario'
        },
        {
          accountId: inventoryAccount.id,
          debit: 0,
          credit: adjustmentValue,
          description: 'Salida por ajuste'
        }
      ];
    } else {
      // Ajuste positivo (ganancia)
      lines = [
        {
          accountId: inventoryAccount.id,
          debit: adjustmentValue,
          credit: 0,
          description: 'Entrada por ajuste'
        },
        {
          accountId: gainAccount.id,
          debit: 0,
          credit: adjustmentValue,
          description: movement.reason || 'Ajuste de inventario'
        }
      ];
    }

    const entry = await prisma.journalEntry.create({
      data: {
        businessId,
        branchId: movement.branchId,
        entryNumber,
        entryDate: movement.createdAt,
        description: `Ajuste de Inventario: ${movement.reason || 'Sin razón'}`,
        source: 'INVENTORY',
        sourceId: movement.id,
        createdById: movement.userId,
        lines: {
          create: lines
        }
      }
    });

    await updateAccountBalances(lines);

    console.log(`✅ Asiento contable creado para ajuste de inventario ${movement.id}`);
    return entry;
  } catch (error) {
    console.error('Error creating inventory adjustment journal entry:', error);
    throw error;
  }
}
