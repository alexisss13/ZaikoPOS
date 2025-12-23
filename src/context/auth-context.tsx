'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface UserSession {
  userId: string;
  branchId: string;
  role: string;
  name: string;
}

const AuthContext = createContext<UserSession | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // CORRECCIÓN: Leemos localStorage DURANTE la inicialización del estado, no después.
  const [session, setSession] = useState<UserSession | null>(() => {
    // Esto solo corre en el cliente
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
    
    // Fallback para desarrollo (Seed ID)
    // Solo si estamos en dev y no hay nada guardado
    if (process.env.NODE_ENV === 'development') {
      return {
        userId: 'user-id-del-seed', // El ID no importa tanto en dev si no validas FKs estrictas aun
        branchId: '9bac85a7-19d8-4089-bcf1-401d45a2cff9', // TU BRANCH ID DEL SEED
        role: 'OWNER',
        name: 'Primo Admin'
      };
    }
    
    return null;
  });

  // Efecto opcional para guardar sesión si cambia (login)
  useEffect(() => {
    if (session) {
      localStorage.setItem('zaiko_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('zaiko_session');
    }
  }, [session]);

  // Si no hay sesión (y no estamos cargando), podrías redirigir o mostrar login
  // Por ahora retornamos null o un loader simple si quisieras bloquear
  if (!session && typeof window !== 'undefined') {
     // Aquí podrías forzar redirect al login si es una ruta protegida
  }

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Para evitar errores en Next.js SSR cuando el contexto aún no está listo
    // Retornamos un mock seguro o lanzamos error controlado
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};