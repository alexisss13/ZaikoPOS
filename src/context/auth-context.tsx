'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Role } from '@/types/role';
import useSWR from 'swr'; 

export interface UserSession {
  userId: string;
  businessId?: string;
  branchId: string;
  role: Role;
  name: string;
  image?: string | null; // 🚀 FIX: Agregamos el tipado para la foto de perfil
  permissions?: Record<string, boolean>;
}

interface AuthContextType extends UserSession {
  user: UserSession | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const fetcher = (url: string) => fetch(url).then(r => r.json());

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zaiko_session');
    if (saved) {
      queueMicrotask(() => {
        try {
          setSessionState(JSON.parse(saved));
        } catch (error) {
          localStorage.removeItem('zaiko_session');
        }
      });
    }
  }, []);

  const setSession = (newSession: UserSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem('zaiko_session', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('zaiko_session');
    }
  };

  const logout = () => {
    setSession(null);
  };

  const { data: liveData } = useSWR(session?.userId ? '/api/auth/me' : null, fetcher, { 
    refreshInterval: 15000 
  });

  const effectivePermissions = liveData?.permissions || session?.permissions || {};
  const effectiveRole = liveData?.role || session?.role || Role.USER;
  const effectiveBranchId = liveData?.branchId || session?.branchId || '';
  // 🚀 FIX: Leemos la imagen de la BD en tiempo real, si no hay, intentamos con la del login
  const effectiveImage = liveData?.image !== undefined ? liveData.image : session?.image;

  const effectiveUser = session ? {
      ...session,
      permissions: effectivePermissions,
      role: effectiveRole,
      branchId: effectiveBranchId,
      image: effectiveImage // 🚀 Lo guardamos en el objeto de usuario efectivo
  } : null;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      userId: session?.userId || '',
      businessId: session?.businessId || '',
      branchId: effectiveBranchId,
      role: effectiveRole, 
      name: session?.name || 'Invitado',
      image: effectiveImage, // 🚀 Exportamos la imagen al resto de la app
      permissions: effectivePermissions,
      isAuthenticated: !!session,
      setSession,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};