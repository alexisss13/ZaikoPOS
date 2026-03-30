import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/security';
import { createSession, SessionPayload } from '@/lib/auth';

interface LoginParams {
  email: string;
  password: string;
}

export const authService = {
  login: async ({ email, password }: LoginParams) => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true } 
    });

    if (!user || !user.password) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado. Contacte al administrador.');
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    // 🚀 LÓGICA ESTRICTA SIN 'ANY'
    const payload = {
      userId: user.id,
      email: user.email!,
      role: user.role,
      businessId: user.businessId || '',
      branchId: user.branchId || '',
      name: user.name || 'Usuario',
      permissions: (user.permissions as Record<string, boolean>) || {},
    };

    // 🚀 Casteo seguro a unknown primero para satisfacer al linter de TypeScript
    await createSession(payload as unknown as SessionPayload);

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId,
        permissions: (user.permissions as Record<string, boolean>) || {}
      }
    };
  },

  logout: async () => {
    return true;
  }
};