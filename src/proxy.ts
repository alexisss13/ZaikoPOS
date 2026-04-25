import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'secret-fallback-dev-only';
const key = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/login', '/register', '/api/auth/login'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Permitir acceso a rutas públicas y assets estáticos
  if (
    publicRoutes.includes(path) || 
    path.startsWith('/_next') || 
    path.startsWith('/static') ||
    path.includes('.') 
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
    if (role === 'CASHIER' && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/pos', req.nextUrl));
    }

    if (role === 'OWNER' && path === '/') {
       return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    
    // Redirección inicial inteligente si entra a raíz
    if (path === '/') {
      if (role === 'CASHIER') return NextResponse.redirect(new URL('/pos', req.nextUrl));
      if (role === 'OWNER' || role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }

    // 4. Inyectar headers para el Backend
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-business-id', (payload.businessId as string) || '');
    requestHeaders.set('x-branch-id', (payload.branchId as string) || '');
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};