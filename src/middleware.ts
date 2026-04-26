import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/login', '/register', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Rutas públicas y assets
  if (
    publicRoutes.includes(path) || 
    path.startsWith('/_next') || 
    path.startsWith('/static') ||
    path.includes('.') 
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('session')?.value;
  const isApiRoute = path.startsWith('/api/');
  
  if (!cookie) {
    if (isApiRoute) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  try {
    const { payload } = await jwtVerify(cookie, key, { algorithms: ['HS256'] });
    const role = payload.role as string;

    // 2. RBAC - Control de acceso por rol
    if (role === 'CASHIER' && path.startsWith('/dashboard') && path !== '/dashboard/pos') {
      return NextResponse.redirect(new URL('/dashboard/pos', req.nextUrl));
    }

    // 3. Inyectar headers (ESTO ES LO QUE HACE QUE LAS APIS FUNCIONEN)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-business-id', (payload.businessId as string) || '');
    requestHeaders.set('x-branch-id', (payload.branchId as string) || '');
    requestHeaders.set('x-user-role', role);

    // Clonamos la petición con los nuevos headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('🔥 MIDDLEWARE ERROR:', error);
    const response = isApiRoute 
      ? NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.nextUrl));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    // Se aplica a todo excepto static files y public
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};