'use client';

import { useSyncExternalStore } from 'react';

export interface ResponsiveBreakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

// Snapshot del servidor (cacheado para evitar loop infinito)
const SERVER_SNAPSHOT: ResponsiveBreakpoint = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 0,
  height: 0,
};

// Store para sincronización externa (evita hydration mismatch)
const createResponsiveStore = () => {
  let listeners: (() => void)[] = [];
  let snapshot: ResponsiveBreakpoint = SERVER_SNAPSHOT;

  const getSnapshot = () => snapshot;
  
  // Retornar siempre la misma referencia para el servidor
  const getServerSnapshot = () => SERVER_SNAPSHOT;

  const subscribe = (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  const updateSnapshot = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newSnapshot = {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 768,
      width,
      height,
    };
    
    // Solo actualizar si realmente cambió
    if (
      snapshot.isMobile !== newSnapshot.isMobile ||
      snapshot.isTablet !== newSnapshot.isTablet ||
      snapshot.width !== newSnapshot.width
    ) {
      snapshot = newSnapshot;
      listeners.forEach(listener => listener());
    }
  };

  // Inicializar inmediatamente si estamos en el cliente
  if (typeof window !== 'undefined') {
    updateSnapshot();
    
    let timeoutId: ReturnType<typeof setTimeout>;
    const debounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSnapshot, 100);
    };

    window.addEventListener('resize', debounced, { passive: true });
  }

  return { getSnapshot, getServerSnapshot, subscribe };
};

const responsiveStore = createResponsiveStore();

/**
 * useResponsive Hook - Optimizado con useSyncExternalStore
 *
 * Evita re-renders innecesarios y sincroniza correctamente con SSR
 */
export function useResponsive(): ResponsiveBreakpoint {
  return useSyncExternalStore(
    responsiveStore.subscribe,
    responsiveStore.getSnapshot,
    responsiveStore.getServerSnapshot
  );
}

export function useMediaQuery(query: string): boolean {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  const subscribe = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useOrientation(): 'portrait' | 'landscape' {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  };

  const getServerSnapshot = () => 'portrait' as const;

  const subscribe = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('resize', callback, { passive: true });
    window.addEventListener('orientationchange', callback, { passive: true });
    return () => {
      window.removeEventListener('resize', callback);
      window.removeEventListener('orientationchange', callback);
    };
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
