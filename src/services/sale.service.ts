import prisma from '@/lib/prisma';
import { getPeruDate } from '@/lib/time';
import { Prisma, PaymentMethod } from '@prisma/client';

// Interfaces de Entrada (DTOs)
interface SaleItemInput {
  productId: string;
  quantity: number;
  price: number; 
}

interface SalePaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

interface CreateSaleParams {
  userId: string;
  branchId: string;
  externalId?: string; // <--- NUEVO: Opcional para idempotencia
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  customerId?: string;
}

export const saleService = {
  createSale: async (params: CreateSaleParams) => {
    const { userId, branchId, externalId, items, payments, customerId } = params; // <--- Destructurar externalId

    // 1. VALIDACIÓN: Caja Abierta
    const cashSession = await prisma.cashSession.findFirst({
      where: {
        userId,
        branchId,
        status: 'OPEN'
      }
    });

    if (!cashSession) {
      throw new Error('No puedes realizar una venta sin una caja abierta.');
    }

    // 2. CÁLCULOS
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal; 
    
    const totalPaid = payments.reduce((acc, pay) => acc + pay.amount, 0);

    if (Math.abs(total - totalPaid) > 0.01) {
      throw new Error(`El pago total (S/ ${totalPaid}) no coincide con el monto de la venta (S/ ${total}).`);
    }

    // 3. TRANSACCIÓN ATÓMICA
    return await prisma.$transaction(async (tx) => {
      
      // A. Verificar y Descontar Stock
      for (const item of items) {
        const stockRecord = await tx.stock.findUnique({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId
            }
          }
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ID: ${item.productId}`);
        }

        await tx.stock.update({
          where: { id: stockRecord.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // B. Crear la Venta Cabecera
      const sale = await tx.sale.create({
        data: {
          externalId, // <--- NUEVO: Pasamos el ID de idempotencia
          branchId,
          userId,
          cashSessionId: cashSession.id,
          customerId,
          subtotal: new Prisma.Decimal(subtotal),
          total: new Prisma.Decimal(total),
          status: 'COMPLETED',
          createdAt: getPeruDate(),
        }
      });

      // C. Crear Items
      await tx.saleItem.createMany({
        data: items.map(item => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: new Prisma.Decimal(item.price),
          subtotal: new Prisma.Decimal(item.price * item.quantity)
        }))
      });

      // D. Crear Pagos
      await tx.salePayment.createMany({
        data: payments.map(p => ({
          saleId: sale.id,
          method: p.method,
          amount: new Prisma.Decimal(p.amount),
          reference: p.reference
        }))
      });

      // E. Actualizar Caja (Solo Cash)
      const cashIncome = payments
        .filter(p => p.method === 'CASH')
        .reduce((acc, p) => acc + p.amount, 0);

      if (cashIncome > 0) {
        await tx.cashSession.update({
          where: { id: cashSession.id },
          data: {
            income: { increment: new Prisma.Decimal(cashIncome) }
          }
        });
      }

      return sale;
    });
  }
};