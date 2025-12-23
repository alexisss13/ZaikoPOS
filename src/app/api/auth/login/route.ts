import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { z } from 'zod';

// Validación de entrada
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar datos
    const { email, password } = loginSchema.parse(body);

    // Ejecutar servicio
    const result = await authService.login({ email, password });

    return NextResponse.json(result);
  } catch (error: unknown) {
    // Manejo seguro de errores en TypeScript
    let errorMessage = 'Error interno del servidor';
    let status = 500;

    if (error instanceof z.ZodError) {
      errorMessage = 'Datos inválidos';
      status = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // Si el servicio lanza error de credenciales, devolvemos 401
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