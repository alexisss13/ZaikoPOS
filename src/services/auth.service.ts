import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/security';
import { createSession, SessionPayload } from '@/lib/auth';
import { Role } from '@prisma/client';

interface LoginParams {
  email: string;
  password: string;
}

export const authService = {
  login: async ({ email, password }: LoginParams) => {
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true } // Opcional, si necesitamos datos del negocio
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado. Contacte al administrador.');
    }

    // 2. Verificar Password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    // 3. Preparar Payload (Aislamiento Multi-tenant)
    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      name: user.name,
    };

    // 4. Crear Sesión (Cookie)
    await createSession(payload);

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        businessId: user.businessId
      }
    };
  },

  logout: async () => {
    // Lógica adicional de auditoría podría ir aquí
    return true;
  }
};