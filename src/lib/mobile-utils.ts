/**
 * Mobile Utility Functions
 * 
 * Provides utility functions for mobile-specific functionality including
 * touch target validation, viewport detection, cache management, and
 * mobile-optimized UI helpers.
 */

import { CachedData, TouchTargetConfig } from '@/types/mobile';

/**
 * Default touch target configuration following iOS and Android guidelines
 */
export const DEFAULT_TOUCH_TARGET: TouchTargetConfig = {
  minWidth: 44,
  minHeight: 44,
  minSpacing: 8,
};

/**
 * Validates if an element meets minimum touch target size requirements
 * 
 * @param element - HTML element to validate
 * @param config - Touch target configuration (optional)
 * @returns true if element meets requirements, false otherwise
 * 
 * @example
 * ```tsx
 * const button = document.getElementById('myButton');
 * if (!isTouchTargetValid(button)) {
 *   console.warn('Button is too small for touch interaction');
 * }
 * ```
 */
export function isTouchTargetValid(
  element: HTMLElement,
  config: TouchTargetConfig = DEFAULT_TOUCH_TARGET
): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= config.minWidth && rect.height >= config.minHeight;
}

/**
 * Detects if the current device is a mobile device based on user agent
 * 
 * @returns true if mobile device, false otherwise
 * 
 * @example
 * ```tsx
 * if (isMobileDevice()) {
 *   // Load mobile-specific features
 * }
 * ```
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile patterns in user agent
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
}

/**
 * Detects if the device supports touch events
 * 
 * @returns true if touch is supported, false otherwise
 * 
 * @example
 * ```tsx
 * if (isTouchDevice()) {
 *   // Enable touch-specific interactions
 * }
 * ```
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Gets the current viewport width
 * 
 * @returns viewport width in pixels
 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth || document.documentElement.clientWidth;
}

/**
 * Gets the current viewport height
 * 
 * @returns viewport height in pixels
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight || document.documentElement.clientHeight;
}

/**
 * Checks if the current viewport is mobile (< 768px)
 * 
 * @returns true if mobile viewport, false otherwise
 */
export function isMobileViewport(): boolean {
  return getViewportWidth() < 768;
}

/**
 * Checks if the current viewport is desktop (>= 768px)
 * 
 * @returns true if desktop viewport, false otherwise
 */
export function isDesktopViewport(): boolean {
  return getViewportWidth() >= 768;
}

/**
 * Cache Management
 */

const CACHE_PREFIX = 'zaiko_mobile_cache_';

/**
 * Stores data in local cache with expiration
 * 
 * @param key - Unique cache key
 * @param data - Data to cache
 * @param expiresIn - Time in milliseconds until expiration (default: 1 hour)
 * 
 * @example
 * ```tsx
 * setCachedData('products', productList, 30 * 60 * 1000); // Cache for 30 minutes
 * ```
 */
export function setCachedData(key: string, data: any, expiresIn: number = 3600000): void {
  if (typeof window === 'undefined') return;

  const cacheEntry: CachedData = {
    key,
    data,
    timestamp: Date.now(),
    expiresIn,
  };

  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
}

/**
 * Retrieves data from local cache if not expired
 * 
 * @param key - Cache key
 * @returns Cached data or null if not found or expired
 * 
 * @example
 * ```tsx
 * const products = getCachedData('products');
 * if (!products) {
 *   // Fetch fresh data
 * }
 * ```
 */
export function getCachedData<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const cacheEntry: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache has expired
    if (now - cacheEntry.timestamp > cacheEntry.expiresIn) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return cacheEntry.data as T;
  } catch (error) {
    console.error('Failed to retrieve cached data:', error);
    return null;
  }
}

/**
 * Clears a specific cache entry
 * 
 * @param key - Cache key to clear
 */
export function clearCachedData(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clears all cached data
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Prevents body scroll (useful for modals and bottom sheets)
 * 
 * @example
 * ```tsx
 * // When modal opens
 * preventBodyScroll();
 * 
 * // When modal closes
 * allowBodyScroll();
 * ```
 */
export function preventBodyScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

/**
 * Allows body scroll (restores normal scrolling)
 */
export function allowBodyScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
}

/**
 * Triggers haptic feedback on supported devices
 * 
 * @param type - Type of haptic feedback ('light', 'medium', 'heavy')
 * 
 * @example
 * ```tsx
 * // On button press
 * triggerHapticFeedback('light');
 * ```
 */
export function triggerHapticFeedback(
  type: 'light' | 'medium' | 'heavy' = 'light'
): void {
  if (typeof window === 'undefined') return;

  // Check if Vibration API is supported
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Formats bytes to human-readable size (useful for image optimization)
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 * 
 * @example
 * ```tsx
 * const fileSize = formatBytes(1536000); // "1.46 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounces a function call
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```tsx
 * const debouncedSearch = debounce((query) => {
 *   searchProducts(query);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function call
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 * 
 * @example
 * ```tsx
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Checks if the device is in standalone mode (installed as PWA)
 * 
 * @returns true if running as PWA, false otherwise
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Gets safe area insets for devices with notches
 * 
 * @returns Object with top, right, bottom, left insets in pixels
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
  };
}
