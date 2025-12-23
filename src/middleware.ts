import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'secret-fallback-dev-only';
const key = new TextEncoder().encode(SECRET_KEY);

// Rutas que no requieren autenticación
const publicRoutes = ['/login', '/register', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Permitir acceso a rutas públicas y assets estáticos
  if (
    publicRoutes.includes(path) || 
    path.startsWith('/_next') || 
    path.startsWith('/static') ||
    path.includes('.') // Archivos (favicon, etc)
  ) {
    return NextResponse.next();
  }

  // 2. Verificar Sesión
  const cookie = req.cookies.get('session')?.value;
  
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  try {
    // Verificar JWT y decodificar
    const { payload } = await jwtVerify(cookie, key, { algorithms: ['HS256'] });
    const role = payload.role as string;

    // 3. Control de Acceso por Rol (RBAC)
    
    // CASHIER: Solo acceso a POS y perfil, prohibido Dashboard
    if (role === 'CASHIER' && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/pos', req.nextUrl));
    }

    // OWNER: Acceso a Dashboard, prohibido (o advertencia) en POS si se requiere
    // Por ahora permitimos al OWNER entrar al POS, pero el flujo principal es Dashboard
    if (role === 'OWNER' && path === '/') {
       return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    
    // Redirección inicial inteligente si entra a raíz
    if (path === '/') {
      if (role === 'CASHIER') return NextResponse.redirect(new URL('/pos', req.nextUrl));
      if (role === 'OWNER' || role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }

    // Inyectar headers con información del usuario para el backend (opcional pero útil)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-business-id', payload.businessId as string || '');
    requestHeaders.set('x-user-role', role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL('/login', req.nextUrl));
    response.cookies.delete('session');
    return response;
  }
}

// Configurar en qué rutas se ejecuta
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico (icono)
     * - public (archivos públicos)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};