import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importación nombrada estricta

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterBranchId = searchParams.get('branchId');
    const filterUserId = searchParams.get('userId');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Rango de fechas requerido' }, { status: 400 });
    }

    // 1. Obtener usuario y su rol para aplicar RBAC
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, branchId: true }
    });

    if (!currentUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // 2. Construir la condición de búsqueda (RBAC Estricto)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'OWNER') {
      // Pueden ver todo, aplicamos filtros si los envían
      if (filterBranchId && filterBranchId !== 'ALL') whereClause.branchId = filterBranchId;
      if (filterUserId && filterUserId !== 'ALL') whereClause.userId = filterUserId;
    } else if (currentUser.role === 'MANAGER') {
      // Jefe de tienda: Forzamos SU sucursal. Puede filtrar por usuarios de su sucursal.
      whereClause.branchId = currentUser.branchId;
      if (filterUserId && filterUserId !== 'ALL') whereClause.userId = filterUserId;
    } else {
      // Cajero: Ve estrictamente lo suyo. Ignoramos cualquier otro filtro.
      whereClause.userId = userId;
    }

    // 3. Consultar las ventas con sus relaciones correctamente anidadas
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            variant: {
              select: {
                barcode: true,
                sku: true,
                product: {
                  select: { title: true }
                }
              }
            }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Calcular el resumen por método de pago para el arqueo
    const summary = {
      CASH: 0, YAPE: 0, PLIN: 0, CARD: 0, TRANSFER: 0, TOTAL: 0
    };

    sales.forEach(sale => {
      if (sale.status !== 'COMPLETED') return;
      sale.payments.forEach(payment => {
        const method = payment.method as keyof typeof summary;
        if (summary[method] !== undefined) {
          summary[method] += Number(payment.amount);
          summary.TOTAL += Number(payment.amount);
        }
      });
    });

    return NextResponse.json({ sales, summary });

  } catch (error) {
    console.error('[SALES_HISTORY_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 });
  }
}