import prisma from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

interface LogOptions {
  action: AuditAction;
  businessId: string;
  userId?: string;
  details?: string | object;
  ip?: string;
}

export async function logAudit({ action, businessId, userId, details, ip }: LogOptions) {
  try {
    // Convertir objeto a string si es necesario
    const detailsString = typeof details === 'object' 
      ? JSON.stringify(details) 
      : details;

    await prisma.auditLog.create({
      data: {
        action,
        businessId,
        userId,
        details: detailsString,
        ipAddress: ip || 'unknown',
      }
    });
  } catch (error) {
    // Si falla el log, no deberíamos detener la aplicación, pero sí reportarlo en consola
    console.error('❌ Error guardando auditoría:', error);
  }
}