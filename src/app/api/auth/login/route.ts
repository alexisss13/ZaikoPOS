import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Ejecutar servicio (Devuelve { user, token })
    const result = await authService.login({ email, password });
    
    // CORRECCIÓN: Obtenemos el usuario del resultado
    const user = result.user; 

    // 👁️ REGISTRAR LOGIN
    // Verificamos que user y businessId existan (el user podría ser SUPER_ADMIN sin businessId)
    if (user && user.businessId) {
        // Ejecutamos sin await para no bloquear la respuesta al cliente (fire & forget)
        logAudit({
          action: 'LOGIN',
          businessId: user.businessId,
          userId: user.id,
          details: `Inicio de sesión vía Web`,
        }).catch(console.error);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    let errorMessage = 'Error interno del servidor';
    let status = 500;

    if (error instanceof z.ZodError) {
      errorMessage = 'Datos inválidos';
      status = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage === 'Credenciales inválidas' || errorMessage.includes('desactivado')) {
        status = 401;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}