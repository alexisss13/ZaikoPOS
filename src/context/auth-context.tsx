'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Role } from '@/types/role';

export interface UserSession {
  userId: string;
  businessId?: string; // 🚀 Agregado
  branchId: string;
  role: Role;
  name: string;
  permissions?: Record<string, boolean>; // 🚀 Agregado para el RBAC
}

interface AuthContextType extends UserSession {
  user: UserSession | null; // 🚀 FIX: Exponemos el objeto usuario completo
  isAuthenticated: boolean;
  setSession: (session: UserSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1. Iniciamos siempre en null. Sin mocks. La verdad viene del localStorage o del Login.
  const [session, setSessionState] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zaiko_session');
    if (saved) {
      // ✅ queueMicrotask evita el error de "cascading renders" 
      // al mover el setState fuera del proceso de commit síncrono.
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

  return (
    <AuthContext.Provider value={{
      user: session, // 🚀 AHORA SÍ EXISTE 'user' para usar user.permissions
      userId: session?.userId || '',
      businessId: session?.businessId || '',
      branchId: session?.branchId || '',
      role: session?.role || Role.USER, 
      name: session?.name || 'Invitado',
      permissions: session?.permissions || {}, // 🚀 Por si lo quieres sacar directo: const { permissions } = useAuth()
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