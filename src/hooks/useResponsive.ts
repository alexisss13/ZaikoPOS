'use client';

import { useState, useEffect } from 'react';
import { ResponsiveBreakpoint } from '@/types/mobile';

/**
 * useResponsive Hook
 * 
 * Detects viewport size and provides responsive breakpoint information
 * based on Tailwind CSS breakpoints (md: 768px).
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: >= 768px and < 1024px
 * - Desktop: >= 768px
 * 
 * @returns ResponsiveBreakpoint object with viewport information
 * 
 * @example
 * ```tsx
 * const { isMobile, isDesktop, width } = useResponsive();
 * 
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useResponsive(): ResponsiveBreakpoint {
  const [breakpoint, setBreakpoint] = useState<ResponsiveBreakpoint>(() => {
    // Server-side rendering: default to mobile-first
    if (typeof window === 'undefined') {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 0,
        height: 0,
      };
    }

    // Client-side: calculate actual breakpoint
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 768,
      width,
      height,
    };
  });

  useEffect(() => {
    // Skip if running on server
    if (typeof window === 'undefined') return;

    /**
     * Handle viewport resize events
     */
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 768,
        width,
        height,
      });
    };

    // Set initial size
    handleResize();

    // Add resize listener with debouncing for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return breakpoint;
}

/**
 * useOrientation Hook
 * 
 * Detects device orientation (portrait or landscape)
 * 
 * @returns 'portrait' | 'landscape'
 * 
 * @example
 * ```tsx
 * const orientation = useOrientation();
 * 
 * return (
 *   <div className={orientation === 'landscape' ? 'flex-row' : 'flex-col'}>
 *     {content}
 *   </div>
 * );
 * ```
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    // Listen to both resize and orientationchange events
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * useMediaQuery Hook
 * 
 * Custom hook for matching CSS media queries
 * 
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 * 
 * @example
 * ```tsx
 * const isSmallScreen = useMediaQuery('(max-width: 640px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
