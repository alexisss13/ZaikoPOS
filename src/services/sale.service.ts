import prisma from '@/lib/prisma';
import { Prisma, PaymentMethod } from '@prisma/client';

interface SaleItemInput {
  productId: string;
  quantity: number;
  price: number; 
}

interface SalePaymentInput {
  method: PaymentMethod;
  amount: number; // Monto aplicado a la venta (Ej: Si cuesta 100, aquí va 100, aunque pague con 200)
  reference?: string | null;
}

interface CreateSaleParams {
  userId: string;
  branchId: string;
  externalId?: string | null;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  tenderedAmount: number; // NUEVO: Cuánto dinero físico/digital entregó el cliente en total
  customerId?: string | null;
}

export const saleService = {
  createSale: async (params: CreateSaleParams) => {
    const { userId, branchId, externalId, items, payments, tenderedAmount, customerId } = params;

    // 1. VALIDACIÓN: Caja Abierta y obtención de BusinessId
    // Incluimos la sucursal para obtener rápidamente a qué negocio pertenece esta venta
    const cashSession = await prisma.cashSession.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: { branch: true } 
    });

    if (!cashSession) throw new Error('CAJA_CERRADA');

    const businessId = cashSession.branch.businessId;

    // 2. CÁLCULOS FINANCIEROS
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalAppliedPayments = payments.reduce((acc, pay) => acc + pay.amount, 0);

    // Regla 1: La suma de los pagos repartidos debe ser EXACTAMENTE igual al total de la venta
    if (Math.abs(total - totalAppliedPayments) > 0.01) {
      throw new Error('PAGOS_NO_CUADRAN');
    }

    // Regla 2: El cliente no puede entregar menos dinero que el total
    if (tenderedAmount < total - 0.01) {
      throw new Error('MONTO_ENTREGADO_MENOR');
    }

    // Cálculo del vuelto
    const changeAmount = tenderedAmount - total;

    // 3. TRANSACCIÓN ATÓMICA
    return await prisma.$transaction(async (tx) => {
      
      // A. Idempotencia: Si ya llegó este ID externo offline, lo devolvemos sin duplicar
      if (externalId) {
        const existing = await tx.sale.findUnique({ where: { externalId } });
        if (existing) return existing;
      }

      // B. Verificar y Descontar Stock
      for (const item of items) {
        const stockRecord = await tx.stock.findUnique({
          where: { branchId_productId: { branchId, productId: item.productId } }
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          throw new Error(`STOCK_CONFLICT:${item.productId}`);
        }

        await tx.stock.update({
          where: { id: stockRecord.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // C. Crear Venta (Cabecera, Items y Pagos anidados de forma eficiente)
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
          tenderedAmount: tenderedAmount, // Registramos lo que pagó
          changeAmount: changeAmount,     // Registramos el vuelto
          status: 'COMPLETED',
          // Creación anidada (Mucho más limpia que hacer createMany sueltos)
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

      // Solo sumamos a la caja el dinero que realmente ingresó para la venta (no el vuelto)
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