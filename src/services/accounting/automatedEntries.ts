import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

interface SaleData {
  id: string;
  branchId: string;
  businessId: string;
  total: number;
  subtotal: number;
  discount: number;
  payments: Array<{
    method: PaymentMethod;
    amount: number;
  }>;
  items: Array<{
    variantId: string;
    quantity: number;
    price: number;
  }>;
}

interface PurchaseData {
  id: string;
  branchId: string;
  businessId: string;
  total: number;
  supplierId: string;
}

/**
 * Automated Journal Entry Service
 * Creates journal entries automatically for sales, purchases, and other transactions
 */
export class AutomatedEntriesService {
  /**
   * Create journal entry for a sale
   * Debits: Cash/Bank (based on payment method) or Accounts Receivable
   * Credits: Sales Revenue
   * Debits: Cost of Goods Sold
   * Credits: Inventory
   */
  async createSaleEntry(saleData: SaleData, userId: string): Promise<void> {
    try {
      // Get account codes for this business
      const accounts = await this.getAccountsByCode(saleData.businessId, [
        '1010', // Caja (Cash)
        '1020', // Bancos (Bank)
        '1210', // Cuentas por Cobrar (AR)
        '7010', // Ventas (Sales Revenue)
        '6910', // Costo de Ventas (COGS)
        '2010'  // Mercaderías (Inventory)
      ]);

      if (!accounts['1010'] || !accounts['7010'] || !accounts['6910'] || !accounts['2010']) {
        console.error('[AutomatedEntries] Missing required accounts for sale entry');
        return;
      }

      // Get last entry number
      const lastEntry = await prisma.journalEntry.findFirst({
        where: { businessId: saleData.businessId },
        orderBy: { entryNumber: 'desc' }
      });
      const entryNumber = (lastEntry?.entryNumber || 0) + 1;

      // Calculate COGS (simplified - using average cost)
      let totalCOGS = 0;
      for (const item of saleData.items) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { 
            product: {
              select: {
                cost: true
              }
            }
          }
        });
        if (variant?.product?.cost) {
          totalCOGS += Number(variant.product.cost) * item.quantity;
        }
      }

      // Prepare journal entry lines
      const lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description: string | null;
      }> = [];

      // Group payments by method
      const cashPayments = saleData.payments.filter(p => p.method === 'CASH');
      const bankPayments = saleData.payments.filter(p => 
        p.method === 'CARD' || p.method === 'TRANSFER' || p.method === 'YAPE' || p.method === 'PLIN'
      );

      const totalCash = cashPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalBank = bankPayments.reduce((sum, p) => sum + p.amount, 0);

      // Debit Cash if cash payments
      if (totalCash > 0 && accounts['1010']) {
        lines.push({
          accountId: accounts['1010'].id,
          debit: totalCash,
          credit: 0,
          description: 'Venta en efectivo'
        });
      }

      // Debit Bank if electronic payments
      if (totalBank > 0 && accounts['1020']) {
        lines.push({
          accountId: accounts['1020'].id,
          debit: totalBank,
          credit: 0,
          description: 'Venta con pago electrónico'
        });
      }

      // Credit Sales Revenue
      lines.push({
        accountId: accounts['7010'].id,
        debit: 0,
        credit: saleData.total,
        description: 'Ingreso por venta'
      });

      // Debit COGS
      if (totalCOGS > 0) {
        lines.push({
          accountId: accounts['6910'].id,
          debit: totalCOGS,
          credit: 0,
          description: 'Costo de mercadería vendida'
        });

        // Credit Inventory
        lines.push({
          accountId: accounts['2010'].id,
          debit: 0,
          credit: totalCOGS,
          description: 'Salida de inventario'
        });
      }

      // Create journal entry in transaction
      await prisma.$transaction(async (tx) => {
        await tx.journalEntry.create({
          data: {
            businessId: saleData.businessId,
            branchId: saleData.branchId,
            entryNumber,
            entryDate: new Date(),
            description: `Venta automática`,
            source: 'SALE',
            sourceId: saleData.id,
            createdById: userId,
            lines: {
              create: lines
            }
          }
        });

        // Update account balances
        for (const line of lines) {
          const netChange = line.debit - line.credit;
          await tx.accountingAccount.update({
            where: { id: line.accountId },
            data: {
              balance: {
                increment: netChange
              }
            }
          });
        }
      });

      console.log(`[AutomatedEntries] Created journal entry for sale ${saleData.id}`);
    } catch (error) {
      console.error('[AutomatedEntries] Error creating sale entry:', error);
      // Don't throw - we don't want to fail the sale if accounting fails
    }
  }

  /**
   * Create journal entry for a purchase
   * Debits: Inventory
   * Credits: Accounts Payable
   */
  async createPurchaseEntry(purchaseData: PurchaseData, userId: string): Promise<void> {
    try {
      // Get account codes for this business
      const accounts = await this.getAccountsByCode(purchaseData.businessId, [
        '2010', // Mercaderías (Inventory)
        '4210'  // Cuentas por Pagar (AP)
      ]);

      if (!accounts['2010'] || !accounts['4210']) {
        console.error('[AutomatedEntries] Missing required accounts for purchase entry');
        return;
      }

      // Get last entry number
      const lastEntry = await prisma.journalEntry.findFirst({
        where: { businessId: purchaseData.businessId },
        orderBy: { entryNumber: 'desc' }
      });
      const entryNumber = (lastEntry?.entryNumber || 0) + 1;

      // Create journal entry in transaction
      await prisma.$transaction(async (tx) => {
        await tx.journalEntry.create({
          data: {
            businessId: purchaseData.businessId,
            branchId: purchaseData.branchId,
            entryNumber,
            entryDate: new Date(),
            description: `Compra automática`,
            source: 'PURCHASE',
            sourceId: purchaseData.id,
            createdById: userId,
            lines: {
              create: [
                {
                  accountId: accounts['2010'].id,
                  debit: purchaseData.total,
                  credit: 0,
                  description: 'Entrada de inventario'
                },
                {
                  accountId: accounts['4210'].id,
                  debit: 0,
                  credit: purchaseData.total,
                  description: 'Cuenta por pagar a proveedor'
                }
              ]
            }
          }
        });

        // Update account balances
        await tx.accountingAccount.update({
          where: { id: accounts['2010'].id },
          data: {
            balance: {
              increment: purchaseData.total
            }
          }
        });

        await tx.accountingAccount.update({
          where: { id: accounts['4210'].id },
          data: {
            balance: {
              increment: -purchaseData.total
            }
          }
        });
      });

      console.log(`[AutomatedEntries] Created journal entry for purchase ${purchaseData.id}`);
    } catch (error) {
      console.error('[AutomatedEntries] Error creating purchase entry:', error);
      // Don't throw - we don't want to fail the purchase if accounting fails
    }
  }

  /**
   * Create reversal entry for a voided transaction
   */
  async createReversalEntry(sourceId: string, source: 'SALE' | 'PURCHASE', userId: string): Promise<void> {
    try {
      // Find original entry
      const originalEntry = await prisma.journalEntry.findFirst({
        where: {
          source,
          sourceId
        },
        include: {
          lines: true
        }
      });

      if (!originalEntry) {
        console.log(`[AutomatedEntries] No journal entry found for ${source} ${sourceId}`);
        return;
      }

      // Get last entry number
      const lastEntry = await prisma.journalEntry.findFirst({
        where: { businessId: originalEntry.businessId },
        orderBy: { entryNumber: 'desc' }
      });
      const entryNumber = (lastEntry?.entryNumber || 0) + 1;

      // Create reversal entry
      await prisma.$transaction(async (tx) => {
        await tx.journalEntry.create({
          data: {
            businessId: originalEntry.businessId,
            branchId: originalEntry.branchId,
            entryNumber,
            entryDate: new Date(),
            description: `Reversión de ${source.toLowerCase()} - Asiento #${originalEntry.entryNumber}`,
            source: 'MANUAL',
            sourceId: null,
            createdById: userId,
            lines: {
              create: originalEntry.lines.map((line) => ({
                accountId: line.accountId,
                debit: line.credit, // Swap
                credit: line.debit, // Swap
                description: `Reversión: ${line.description || ''}`
              }))
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
                decrement: netChange
              }
            }
          });
        }
      });

      console.log(`[AutomatedEntries] Created reversal entry for ${source} ${sourceId}`);
    } catch (error) {
      console.error('[AutomatedEntries] Error creating reversal entry:', error);
    }
  }

  /**
   * Helper: Get accounts by code for a business
   */
  private async getAccountsByCode(
    businessId: string,
    codes: string[]
  ): Promise<Record<string, { id: string; code: string; name: string }>> {
    const accounts = await prisma.accountingAccount.findMany({
      where: {
        businessId,
        code: { in: codes },
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    const accountMap: Record<string, { id: string; code: string; name: string }> = {};
    for (const account of accounts) {
      accountMap[account.code] = account;
    }

    return accountMap;
  }
}

export const automatedEntriesService = new AutomatedEntriesService();
