import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Definición del Payload del Token
export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  businessId: string | null; // Null para SUPER_ADMIN
  name: string;
}

const SECRET_KEY = process.env.JWT_SECRET || 'secret-fallback-dev-only';
const key = new TextEncoder().encode(SECRET_KEY);

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Sesión de 1 día
    .sign(key);

  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}