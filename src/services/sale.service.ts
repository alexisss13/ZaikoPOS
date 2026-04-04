// src/services/sale.service.ts
import prisma from '@/lib/prisma';
import { Prisma, PaymentMethod } from '@prisma/client';

interface SaleItemInput {
  productId: string;
  quantity: number;
  price: number; 
}

interface SalePaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
}

interface CreateSaleParams {
  userId: string;
  branchId: string;
  externalId?: string | null;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  tenderedAmount: number;
  customerId?: string | null;
}

export const saleService = {
  createSale: async (params: CreateSaleParams) => {
    const { userId, branchId, externalId, items, payments, tenderedAmount, customerId } = params;

    // 1. VALIDACIÓN: Caja Abierta y obtención de BusinessId
    const cashSession = await prisma.cashSession.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: { branch: true } 
    });

    if (!cashSession) throw new Error('CAJA_CERRADA');

    const businessId = cashSession.branch.businessId;

    // 2. CÁLCULOS FINANCIEROS
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalAppliedPayments = payments.reduce((acc, pay) => acc + pay.amount, 0);

    if (Math.abs(total - totalAppliedPayments) > 0.01) {
      throw new Error('PAGOS_NO_CUADRAN');
    }

    if (tenderedAmount < total - 0.01) {
      throw new Error('MONTO_ENTREGADO_MENOR');
    }

    const changeAmount = tenderedAmount - total;

    // 3. TRANSACCIÓN ATÓMICA
    return await prisma.$transaction(async (tx) => {
      
      // A. Idempotencia: Evitar duplicados por offline
      if (externalId) {
        const existing = await tx.sale.findUnique({ where: { externalId } });
        if (existing) return existing;
      }

      // B. Verificar y Descontar Stock (FÍSICO Y GLOBAL)
      for (const item of items) {
        // Consultar el stock físico de la sucursal
        const stockRecord = await tx.stock.findUnique({
          where: { branchId_productId: { branchId, productId: item.productId } }
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          throw new Error(`STOCK_CONFLICT:${item.productId}`);
        }

        // B.1 Descontar Stock Físico (Sucursal)
        await tx.stock.update({
          where: { id: stockRecord.id },
          data: { quantity: { decrement: item.quantity } }
        });

        // B.2 Descontar Stock Global (E-commerce)
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // C. Crear Venta (Cabecera, Items y Pagos anidados)
      const sale = await tx.sale.create({
        data: {
          externalId,
          businessId,
          branchId,
          userId,
          cashSessionId: cashSession.id,
          customerId,
          subtotal: total,
          total: total,
          tenderedAmount: tenderedAmount,
          changeAmount: changeAmount,
          status: 'COMPLETED',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity
            }))
          },
          payments: {
            create: payments.map(p => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference || null
            }))
          }
        }
      });

      // D. Actualizar Caja Físicamente (Solo Efectivo)
      const cashIncome = payments
        .filter(p => p.method === 'CASH')
        .reduce((acc, p) => acc + p.amount, 0);

      if (cashIncome > 0) {
        await tx.cashSession.update({
          where: { id: cashSession.id },
          data: { income: { increment: cashIncome } }
        });
      }

      return sale;
    });
  }
};