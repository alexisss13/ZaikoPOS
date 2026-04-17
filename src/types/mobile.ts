/**
 * Mobile UI State and Type Definitions
 * 
 * Defines TypeScript interfaces for mobile-specific state management,
 * responsive breakpoints, touch gestures, and cached data.
 */

/**
 * Mobile UI State
 * Manages the state of mobile-specific UI components
 */
export interface MobileUIState {
  /** Controls the visibility of the mobile hamburger menu drawer */
  isMobileMenuOpen: boolean;
  /** Tracks which bottom sheet is currently active (if any) */
  activeBottomSheet: 'cart' | 'filters' | null;
  /** Enables or disables touch gesture recognition */
  touchGestureEnabled: boolean;
  /** Current device orientation */
  orientation: 'portrait' | 'landscape';
}

/**
 * Responsive Breakpoint Information
 * Provides viewport size detection based on Tailwind CSS breakpoints
 */
export interface ResponsiveBreakpoint {
  /** True if viewport width < 768px (mobile) */
  isMobile: boolean;
  /** True if viewport width >= 768px and < 1024px (tablet) */
  isTablet: boolean;
  /** True if viewport width >= 768px (desktop) */
  isDesktop: boolean;
  /** Current viewport width in pixels */
  width: number;
  /** Current viewport height in pixels */
  height: number;
}

/**
 * Touch Gesture Event
 * Represents a recognized touch gesture on mobile devices
 */
export interface TouchGesture {
  /** Type of gesture detected */
  type: 'swipe' | 'pinch' | 'longpress' | 'pull';
  /** Direction of the gesture (for swipe and pull) */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** The HTML element that was the target of the gesture */
  target: HTMLElement;
  /** Optional velocity of the gesture (pixels per millisecond) */
  velocity?: number;
  /** Optional distance traveled (for swipe gestures) */
  distance?: number;
}

/**
 * Cached Data Entry
 * Represents data cached for offline/performance optimization
 */
export interface CachedData {
  /** Unique identifier for the cached data */
  key: string;
  /** The actual cached data (any type) */
  data: any;
  /** Timestamp when the data was cached (milliseconds since epoch) */
  timestamp: number;
  /** Time in milliseconds until the cache expires */
  expiresIn: number;
}

/**
 * Touch Target Configuration
 * Ensures interactive elements meet minimum touch target size requirements
 */
export interface TouchTargetConfig {
  /** Minimum width in pixels (default: 44px per iOS/Android guidelines) */
  minWidth: number;
  /** Minimum height in pixels (default: 44px per iOS/Android guidelines) */
  minHeight: number;
  /** Minimum spacing between touch targets in pixels (default: 8px) */
  minSpacing: number;
}

/**
 * Mobile Layout Mode
 * Defines different layout strategies for mobile views
 */
export type MobileLayoutMode = 'stacked' | 'card' | 'list' | 'grid';

/**
 * Bottom Sheet Configuration
 * Configuration options for bottom sheet components
 */
export interface BottomSheetConfig {
  /** Height mode of the bottom sheet */
  height: 'half' | 'full' | 'auto';
  /** Whether the sheet can be dismissed by swiping down */
  dismissible: boolean;
  /** Whether to show a backdrop behind the sheet */
  showBackdrop: boolean;
  /** Whether tapping the backdrop closes the sheet */
  closeOnBackdropClick: boolean;
}

/**
 * Viewport Change Event
 * Emitted when viewport size or orientation changes
 */
export interface ViewportChangeEvent {
  /** Previous breakpoint state */
  previous: ResponsiveBreakpoint;
  /** Current breakpoint state */
  current: ResponsiveBreakpoint;
  /** Whether the change was an orientation change */
  isOrientationChange: boolean;
}
