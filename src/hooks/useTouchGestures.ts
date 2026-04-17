'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TouchGesture } from '@/types/mobile';

/**
 * Touch Gesture Configuration
 */
interface TouchGestureConfig {
  /** Minimum distance in pixels to recognize a swipe (default: 50) */
  swipeThreshold?: number;
  /** Maximum time in ms for a swipe gesture (default: 300) */
  swipeTimeout?: number;
  /** Minimum time in ms to recognize a long press (default: 500) */
  longPressDelay?: number;
  /** Enable swipe gestures */
  enableSwipe?: boolean;
  /** Enable long press gestures */
  enableLongPress?: boolean;
  /** Enable pull-to-refresh gesture */
  enablePull?: boolean;
}

/**
 * Touch Gesture Handlers
 */
interface TouchGestureHandlers {
  /** Called when a swipe gesture is detected */
  onSwipe?: (gesture: TouchGesture) => void;
  /** Called when a long press is detected */
  onLongPress?: (gesture: TouchGesture) => void;
  /** Called when a pull gesture is detected */
  onPull?: (gesture: TouchGesture) => void;
}

/**
 * useTouchGestures Hook
 * 
 * Provides touch gesture recognition for mobile devices.
 * Supports swipe, long press, and pull-to-refresh gestures.
 * 
 * @param handlers - Callback functions for different gesture types
 * @param config - Configuration options for gesture recognition
 * @returns Ref to attach to the target element
 * 
 * @example
 * ```tsx
 * const { onSwipe, onLongPress } = useTouchGestures({
 *   onSwipe: (gesture) => {
 *     if (gesture.direction === 'left') {
 *       // Handle swipe left
 *     }
 *   },
 *   onLongPress: (gesture) => {
 *     // Show context menu
 *   }
 * });
 * 
 * return <div ref={gestureRef}>Swipeable content</div>;
 * ```
 */
export function useTouchGestures(
  handlers: TouchGestureHandlers = {},
  config: TouchGestureConfig = {}
) {
  const {
    swipeThreshold = 50,
    swipeTimeout = 300,
    longPressDelay = 500,
    enableSwipe = true,
    enableLongPress = true,
    enablePull = false,
  } = config;

  const { onSwipe, onLongPress, onPull } = handlers;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  /**
   * Handle touch start event
   */
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Start long press timer
      if (enableLongPress && onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (touchStartRef.current && event.target instanceof HTMLElement) {
            const gesture: TouchGesture = {
              type: 'longpress',
              target: event.target,
            };
            onLongPress(gesture);
          }
        }, longPressDelay);
      }
    },
    [enableLongPress, onLongPress, longPressDelay]
  );

  /**
   * Handle touch move event
   */
  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * Handle touch end event
   */
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!touchStartRef.current) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Calculate distance and velocity
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Detect swipe gesture
      if (enableSwipe && onSwipe && distance >= swipeThreshold && deltaTime <= swipeTimeout) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        let direction: 'up' | 'down' | 'left' | 'right';

        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        if (event.target instanceof HTMLElement) {
          const gesture: TouchGesture = {
            type: 'swipe',
            direction,
            target: event.target,
            velocity,
            distance,
          };
          onSwipe(gesture);
        }
      }

      // Detect pull-to-refresh gesture
      if (enablePull && onPull && deltaY > swipeThreshold && deltaTime <= swipeTimeout) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Only trigger pull if at the top of the page
        if (scrollTop === 0 && deltaY > 0 && event.target instanceof HTMLElement) {
          const gesture: TouchGesture = {
            type: 'pull',
            direction: 'down',
            target: event.target,
            velocity,
            distance: Math.abs(deltaY),
          };
          onPull(gesture);
        }
      }

      touchStartRef.current = null;
    },
    [enableSwipe, enablePull, onSwipe, onPull, swipeThreshold, swipeTimeout]
  );

  /**
   * Attach event listeners to the element
   */
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

/**
 * useSwipeGesture Hook
 * 
 * Simplified hook for swipe-only gesture detection
 * 
 * @param onSwipe - Callback when swipe is detected
 * @param config - Swipe configuration
 * @returns Ref to attach to the target element
 * 
 * @example
 * ```tsx
 * const swipeRef = useSwipeGesture((gesture) => {
 *   if (gesture.direction === 'left') {
 *     goToNextSlide();
 *   }
 * });
 * 
 * return <div ref={swipeRef}>Swipeable content</div>;
 * ```
 */
export function useSwipeGesture(
  onSwipe: (gesture: TouchGesture) => void,
  config?: TouchGestureConfig
) {
  return useTouchGestures(
    { onSwipe },
    { ...config, enableSwipe: true, enableLongPress: false, enablePull: false }
  );
}

/**
 * useLongPress Hook
 * 
 * Simplified hook for long press gesture detection
 * 
 * @param onLongPress - Callback when long press is detected
 * @param delay - Long press delay in milliseconds (default: 500)
 * @returns Ref to attach to the target element
 * 
 * @example
 * ```tsx
 * const longPressRef = useLongPress(() => {
 *   showContextMenu();
 * });
 * 
 * return <div ref={longPressRef}>Long press me</div>;
 * ```
 */
export function useLongPress(
  onLongPress: (gesture: TouchGesture) => void,
  delay: number = 500
) {
  return useTouchGestures(
    { onLongPress },
    { enableSwipe: false, enableLongPress: true, enablePull: false, longPressDelay: delay }
  );
}

/**
 * usePullToRefresh Hook
 * 
 * Simplified hook for pull-to-refresh gesture detection
 * 
 * @param onRefresh - Callback when pull-to-refresh is triggered
 * @returns Ref to attach to the target element
 * 
 * @example
 * ```tsx
 * const pullRef = usePullToRefresh(() => {
 *   refreshData();
 * });
 * 
 * return <div ref={pullRef}>Pull to refresh</div>;
 * ```
 */
export function usePullToRefresh(onRefresh: () => void) {
  return useTouchGestures(
    {
      onPull: () => onRefresh(),
    },
    { enableSwipe: false, enableLongPress: false, enablePull: true }
  );
}
