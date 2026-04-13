import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar la sesión de caja abierta del usuario
    const cashSession = await prisma.cashSession.findFirst({
      where: { 
        userId,
        closedAt: null
      },
      orderBy: { openedAt: 'desc' }
    });

    if (!cashSession) {
      return NextResponse.json({ sales: [] });
    }

    // Obtener todas las ventas de esta sesión
    const sales = await prisma.sale.findMany({
      where: {
        cashSessionId: cashSession.id
      },
      include: {
        items: {
          include: {
            variant: {
              select: {
                sku: true,
                barcode: true
              }
            }
          }
        },
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            docNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatear las ventas para el frontend
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      code: sale.code,
      status: sale.status,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      total: Number(sale.total),
      tenderedAmount: Number(sale.tenderedAmount),
      changeAmount: Number(sale.changeAmount),
      createdAt: sale.createdAt,
      cashier: sale.user,
      customer: sale.customer,
      items: sale.items.map(item => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.variant?.sku,
        barcode: item.variant?.barcode,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal)
      })),
      payments: sale.payments.map(payment => ({
        id: payment.id,
        method: payment.method,
        amount: Number(payment.amount),
        reference: payment.reference
      }))
    }));

    return NextResponse.json({ sales: formattedSales });

  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}
