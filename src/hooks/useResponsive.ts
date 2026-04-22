'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

export interface ResponsiveBreakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

// Store para sincronización externa (evita hydration mismatch)
const createResponsiveStore = () => {
  let listeners: (() => void)[] = [];
  let snapshot: ResponsiveBreakpoint = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 0,
    height: 0,
  };

  const getSnapshot = () => snapshot;
  
  const getServerSnapshot = () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 0,
    height: 0,
  });

  const subscribe = (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  const updateSnapshot = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    snapshot = {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 768,
      width,
      height,
    };
    listeners.forEach(listener => listener());
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
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const update = () =>
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return orientation;
}
