import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/security';
import { createSession, SessionPayload } from '@/lib/auth';

interface LoginParams {
  email: string;
  password: string;
}

export const authService = {
  login: async ({ email, password }: LoginParams) => {
    // 1. Buscar usuario e incluir la relación
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true } 
    });

    // Validar si existe y si tiene contraseña (evita crash si se registró con Google)
    if (!user || !user.password) {
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
      email: user.email!,
      role: user.role,
      businessId: user.businessId || '',
      branchId: user.branchId || '', // <--- CRÍTICO
      name: user.name || 'Usuario',
    };

    // 4. Crear Sesión (Cookie JWT)
    await createSession(payload);

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId
      }
    };
  },

  logout: async () => {
    // La eliminación de la cookie se maneja en el route handler o server action
    return true;
  }
};