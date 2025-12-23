'use client';

import { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';

// Tipos
export interface UserSession {
  userId: string;
  branchId: string;
  role: string;
  name: string;
}

// Lo que el contexto va a exponer realmente
interface AuthContextType extends UserSession {
  isAuthenticated: boolean;
  setSession: Dispatch<SetStateAction<UserSession | null>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicialización perezosa (Lazy) segura
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zaiko_session');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Error parseando sesión", e);
        }
      }
    }
    
    // MOCK PARA DESARROLLO (Si no hay sesión real)
    if (process.env.NODE_ENV === 'development') {
      return {
        userId: 'user-id-del-seed',
        branchId: '9bac85a7-19d8-4089-bcf1-401d45a2cff9', // Ojo: Usa tu ID real del seed si lo tienes
        role: 'OWNER',
        name: 'Primo Admin'
      };
    }
    
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('zaiko_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('zaiko_session');
    }
  }, [session]);

  const logout = () => {
    setSession(null);
    localStorage.removeItem('zaiko_session');
    // Aquí podrías forzar redirect con window.location.href = '/login'
  };

  // Valores derivados seguros
  // Si no hay sesión, devolvemos strings vacíos para evitar crashes al destructurar
  const contextValue: AuthContextType = {
    userId: session?.userId || '',
    branchId: session?.branchId || '',
    role: session?.role || '',
    name: session?.name || '',
    isAuthenticated: !!session,
    setSession, // <--- Ahora sí exponemos la función
    logout
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};