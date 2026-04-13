// src/services/sale.service.ts
import prisma from '@/lib/prisma';
import { Prisma, PaymentMethod } from '@prisma/client';

interface SaleItemInput {
  variantId: string;
  productName: string;
  variantName?: string;
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
  discount?: number; // Descuento global aplicado
}

export const saleService = {
  createSale: async (params: CreateSaleParams) => {
    const { userId, branchId, externalId, items, payments, tenderedAmount, customerId, discount = 0 } = params;

    // 1. VALIDACIÓN: Caja Abierta y obtención de BusinessId
    const cashSession = await prisma.cashSession.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: { branch: true } 
    });

    if (!cashSession) throw new Error('CAJA_CERRADA');

    const businessId = cashSession.branch.businessId;

    // 2. CÁLCULOS FINANCIEROS
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal - discount; // Restar el descuento del subtotal
    const totalAppliedPayments = payments.reduce((acc, pay) => acc + pay.amount, 0);

    // Validar que los pagos coincidan con el total (después del descuento)
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

      // B. Generar código de ticket personalizado (T001-0001)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Contar ventas del día en esta sucursal
      const todaySalesCount = await tx.sale.count({
        where: {
          branchId,
          createdAt: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      });
      
      const ticketNumber = (todaySalesCount + 1).toString().padStart(4, '0');
      const ticketCode = `T001-${ticketNumber}`;

      // C. Verificar y Descontar Stock (FÍSICO)
      for (const item of items) {
        // Consultar el stock físico de la sucursal usando variantId
        const stockRecord = await tx.stock.findUnique({
          where: { branchId_variantId: { branchId, variantId: item.variantId } }
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          throw new Error(`STOCK_CONFLICT:${item.variantId}`);
        }

        // Descontar Stock Físico (Sucursal)
        await tx.stock.update({
          where: { id: stockRecord.id },
          data: { quantity: { decrement: item.quantity } }
        });

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            branchId,
            userId,
            type: 'SALE_POS',
            quantity: -item.quantity,
            previousStock: stockRecord.quantity,
            currentStock: stockRecord.quantity - item.quantity,
            reason: `Venta POS - ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}`
          }
        });
      }

      // D. Crear Venta (Cabecera, Items y Pagos anidados)
      const sale = await tx.sale.create({
        data: {
          code: ticketCode,
          externalId,
          businessId,
          branchId,
          userId,
          cashSessionId: cashSession.id,
          customerId,
          subtotal: subtotal, // Subtotal antes del descuento
          discount: discount, // Monto del descuento aplicado
          total: total, // Total final (subtotal - discount)
          tenderedAmount: tenderedAmount,
          changeAmount: changeAmount,
          status: 'COMPLETED',
          items: {
            create: items.map(item => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName || null,
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

      console.log('Venta creada:', {
        code: sale.code,
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total
      });

      // E. Calcular y asignar puntos si hay cliente vinculado
      if (customerId) {
        // 🔥 LÓGICA FIJA: Por cada S/ 2 gastados = 1 punto
        const pointsEarned = Math.floor(total / 2);

        if (pointsEarned > 0) {
          // Actualizar balance de puntos del cliente
          await tx.customer.update({
            where: { id: customerId },
            data: {
              pointsBalance: { increment: pointsEarned },
              totalSpent: { increment: total },
              visits: { increment: 1 },
              lastPurchase: new Date()
            }
          });

          // Registrar transacción de puntos
          await tx.pointTransaction.create({
            data: {
              businessId,
              customerId,
              saleId: sale.id,
              points: pointsEarned,
              type: 'EARN',
              description: `Compra en POS - ${ticketCode} (S/ ${total.toFixed(2)})`
            }
          });

          // Actualizar la venta con los puntos ganados
          await tx.sale.update({
            where: { id: sale.id },
            data: { pointsEarned }
          });
        }
      }

      // F. Actualizar Caja Físicamente (Solo Efectivo)
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