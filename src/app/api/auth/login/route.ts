import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Ejecutar servicio (Genera JWT y cookie)
    const result = await authService.login({ email, password });

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