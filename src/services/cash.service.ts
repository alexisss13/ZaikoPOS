import prisma from '@/lib/prisma';
import { getPeruDate } from '@/lib/time'; // Tu utilidad de fecha
import { Prisma } from '@prisma/client';

interface OpenCashParams {
  userId: string;
  branchId: string;
  initialCash: number;
}

interface CloseCashParams {
  userId: string;
  cashSessionId: string;
  finalCash: number;
}

export const cashService = {
  // 1. Obtener sesión actual (Validación Reusable)
  getCurrentSession: async (branchId: string) => {
    return await prisma.cashSession.findFirst({
      where: {
        branchId,
        status: 'OPEN',
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
  },

  // 2. Abrir Caja
  openSession: async ({ userId, branchId, initialCash }: OpenCashParams) => {
    // A. Validar que la sucursal no tenga caja abierta (Regla estricta MVP)
    const activeBranchSession = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    if (activeBranchSession) {
      throw new Error('Ya existe una caja abierta en esta sucursal.');
    }

    // B. Validar que el usuario no tenga otra caja (por seguridad)
    const activeUserSession = await prisma.cashSession.findFirst({
      where: { userId, status: 'OPEN' }
    });

    if (activeUserSession) {
      throw new Error('El usuario ya tiene una caja activa en otra sucursal.');
    }

    // C. Crear sesión
    return await prisma.cashSession.create({
      data: {
        branchId,
        userId,
        initialCash: new Prisma.Decimal(initialCash),
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
        status: 'OPEN',
        openedAt: getPeruDate(), // Hora Perú
      },
    });
  },

  // 3. Cerrar Caja (Arqueo)
  closeSession: async ({ userId, cashSessionId, finalCash }: CloseCashParams) => {
    // A. Buscar la sesión
    const session = await prisma.cashSession.findUnique({
      where: { id: cashSessionId }
    });

    if (!session) throw new Error('Caja no encontrada.');
    if (session.status !== 'OPEN') throw new Error('Esta caja ya está cerrada.');
    
    // B. Seguridad: Solo quien abrió cierra (o un Owner/Admin si implementamos override luego)
    if (session.userId !== userId) {
      throw new Error('No puedes cerrar la caja de otro usuario.');
    }

    // C. Cálculos Financieros
    // Sistema espera: Inicial + Ingresos - Egresos
    const expectedCash = Number(session.initialCash) + Number(session.income) - Number(session.expense);
    const difference = finalCash - expectedCash;

    // D. Actualizar BD
    return await prisma.cashSession.update({
      where: { id: cashSessionId },
      data: {
        finalCash: new Prisma.Decimal(finalCash),
        difference: new Prisma.Decimal(difference),
        status: 'CLOSED',
        closedAt: getPeruDate(),
      },
    });
  }
};