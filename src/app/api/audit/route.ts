import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const role = req.headers.get('x-user-role');

  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const filterBusinessId = searchParams.get('businessId');
    const severity = searchParams.get('severity') || 'ALL';
    
    // 🚀 NUEVO: Capturamos las fechas
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    const CRITICAL_ACTIONS: AuditAction[] = ['SYSTEM_ERROR', 'DELETE_USER'];
    const WARNING_ACTIONS: AuditAction[] = ['VOID_SALE'];
    const INFO_ACTIONS: AuditAction[] = ['LOGIN', 'LOGOUT', 'CREATE_USER'];
    
    let actionFilter: AuditAction[] = [...CRITICAL_ACTIONS, ...WARNING_ACTIONS, ...INFO_ACTIONS];
    
    if (severity === 'CRITICAL') actionFilter = CRITICAL_ACTIONS;
    if (severity === 'WARNING') actionFilter = WARNING_ACTIONS;
    if (severity === 'INFO') actionFilter = INFO_ACTIONS;

    const whereClause: Prisma.AuditLogWhereInput = {
      action: { in: actionFilter }
    };

    if (filterBusinessId && filterBusinessId !== 'ALL') {
      whereClause.businessId = filterBusinessId;
    }

    // 🚀 NUEVO: Filtro en la base de datos por Rango de Fechas
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true, role: true } },
          business: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener registros de auditoría' }, { status: 500 });
  }
}

// 🚀 NUEVO: Endpoint temporal para inyectar datos de prueba
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const log = await prisma.auditLog.create({
      data: {
        action: body.action,
        details: body.details,
        businessId: body.businessId,
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear log de prueba' }, { status: 500 });
  }
}