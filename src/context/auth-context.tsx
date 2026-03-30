'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Role } from '@/types/role';
import useSWR from 'swr'; // 🚀 IMPORTAMOS SWR

export interface UserSession {
  userId: string;
  businessId?: string;
  branchId: string;
  role: Role;
  name: string;
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

  // 🚀 MAGIA EN TIEMPO REAL: Si hay sesión, consultamos los permisos más recientes de la BD
  // Refresca automáticamente si el dueño hace cambios en el panel.
  const { data: liveData } = useSWR(session?.userId ? '/api/auth/me' : null, fetcher, { 
    refreshInterval: 15000 // Revisa cada 15 segundos silenciosamente
  });

  // Fusionamos los datos en vivo con los del LocalStorage
  const effectivePermissions = liveData?.permissions || session?.permissions || {};
  const effectiveRole = liveData?.role || session?.role || Role.USER;
  const effectiveBranchId = liveData?.branchId || session?.branchId || '';

  const effectiveUser = session ? {
      ...session,
      permissions: effectivePermissions,
      role: effectiveRole,
      branchId: effectiveBranchId
  } : null;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      userId: session?.userId || '',
      businessId: session?.businessId || '',
      branchId: effectiveBranchId,
      role: effectiveRole, 
      name: session?.name || 'Invitado',
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