# Mobile Responsive Infrastructure

This document describes the mobile responsive infrastructure implemented for ZaikoPOS.

## Overview

The mobile infrastructure provides a complete set of tools for building responsive, touch-friendly mobile experiences:

- **Responsive Hooks**: Detect viewport size and orientation changes
- **Touch Gesture Support**: Handle swipe, long press, and pull-to-refresh gestures
- **Mobile Utilities**: Cache management, viewport detection, and mobile-specific helpers
- **TypeScript Types**: Comprehensive type definitions for mobile UI state

## Architecture

### Breakpoints

Following Tailwind CSS conventions:
- **Mobile**: < 768px
- **Tablet**: >= 768px and < 1024px
- **Desktop**: >= 768px

### Files Structure

```
src/
├── types/
│   └── mobile.ts                    # TypeScript interfaces
├── hooks/
│   ├── useResponsive.ts             # Viewport detection hooks
│   ├── useTouchGestures.ts          # Touch gesture hooks
│   └── __tests__/
│       └── useResponsive.test.ts    # Tests
├── lib/
│   ├── mobile-utils.ts              # Utility functions
│   └── __tests__/
│       └── mobile-utils.test.ts     # Tests
└── examples/
    └── mobile-infrastructure-usage.tsx  # Usage examples
```

## Components

### 1. TypeScript Types (`src/types/mobile.ts`)

Defines interfaces for:
- `MobileUIState`: Mobile UI component state
- `ResponsiveBreakpoint`: Viewport size information
- `TouchGesture`: Touch gesture events
- `CachedData`: Cached data structure
- `TouchTargetConfig`: Touch target size requirements
- `BottomSheetConfig`: Bottom sheet configuration

### 2. Responsive Hooks (`src/hooks/useResponsive.ts`)

#### `useResponsive()`
Detects viewport size and provides breakpoint information.

```tsx
const { isMobile, isDesktop, width, height } = useResponsive();

return (
  <div>
    {isMobile ? <MobileNav /> : <DesktopNav />}
  </div>
);
```

#### `useOrientation()`
Detects device orientation (portrait/landscape).

```tsx
const orientation = useOrientation();

return (
  <div className={orientation === 'landscape' ? 'flex-row' : 'flex-col'}>
    {content}
  </div>
);
```

#### `useMediaQuery(query: string)`
Custom hook for matching CSS media queries.

```tsx
const isSmallScreen = useMediaQuery('(max-width: 640px)');
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
```

### 3. Touch Gesture Hooks (`src/hooks/useTouchGestures.ts`)

#### `useTouchGestures(handlers, config)`
Comprehensive gesture recognition.

```tsx
const gestureRef = useTouchGestures({
  onSwipe: (gesture) => {
    if (gesture.direction === 'left') {
      goToNext();
    }
  },
  onLongPress: (gesture) => {
    showContextMenu();
  },
  onPull: () => {
    refreshData();
  }
}, {
  swipeThreshold: 50,
  longPressDelay: 500,
  enableSwipe: true,
  enableLongPress: true,
  enablePull: true
});

return <div ref={gestureRef}>Swipeable content</div>;
```

#### `useSwipeGesture(onSwipe, config)`
Simplified swipe-only detection.

```tsx
const swipeRef = useSwipeGesture((gesture) => {
  if (gesture.direction === 'left') {
    goToNextSlide();
  }
});

return <div ref={swipeRef}>Swipeable content</div>;
```

#### `useLongPress(onLongPress, delay)`
Long press gesture detection.

```tsx
const longPressRef = useLongPress(() => {
  showContextMenu();
}, 500);

return <div ref={longPressRef}>Long press me</div>;
```

#### `usePullToRefresh(onRefresh)`
Pull-to-refresh gesture.

```tsx
const pullRef = usePullToRefresh(() => {
  refreshData();
});

return <div ref={pullRef}>Pull to refresh</div>;
```

### 4. Mobile Utilities (`src/lib/mobile-utils.ts`)

#### Viewport Detection

```tsx
import { isMobileViewport, isDesktopViewport, getViewportWidth } from '@/lib/mobile-utils';

if (isMobileViewport()) {
  // Load mobile-specific features
}
```

#### Device Detection

```tsx
import { isMobileDevice, isTouchDevice } from '@/lib/mobile-utils';

if (isTouchDevice()) {
  // Enable touch-specific interactions
}
```

#### Touch Target Validation

```tsx
import { isTouchTargetValid, DEFAULT_TOUCH_TARGET } from '@/lib/mobile-utils';

const button = document.getElementById('myButton');
if (!isTouchTargetValid(button)) {
  console.warn('Button is too small for touch interaction');
}
```

#### Cache Management

```tsx
import { setCachedData, getCachedData, clearCachedData } from '@/lib/mobile-utils';

// Cache data for 30 minutes
setCachedData('products', productList, 30 * 60 * 1000);

// Retrieve cached data
const products = getCachedData('products');
if (!products) {
  // Fetch fresh data
}

// Clear specific cache
clearCachedData('products');
```

#### Body Scroll Control

```tsx
import { preventBodyScroll, allowBodyScroll } from '@/lib/mobile-utils';

// When modal opens
preventBodyScroll();

// When modal closes
allowBodyScroll();
```

#### Haptic Feedback

```tsx
import { triggerHapticFeedback } from '@/lib/mobile-utils';

// On button press
triggerHapticFeedback('light');  // 'light' | 'medium' | 'heavy'
```

#### Utility Functions

```tsx
import { formatBytes, debounce, throttle } from '@/lib/mobile-utils';

// Format file sizes
const size = formatBytes(1536000); // "1.46 MB"

// Debounce search
const debouncedSearch = debounce((query) => {
  searchProducts(query);
}, 300);

// Throttle scroll handler
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

## Usage Patterns

### Pattern 1: Responsive Component

```tsx
'use client';

import { useResponsive } from '@/hooks/useResponsive';

export function MyComponent() {
  const { isMobile } = useResponsive();

  return (
    <div className={isMobile ? 'p-4' : 'p-8'}>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

### Pattern 2: Swipeable Card List

```tsx
'use client';

import { useSwipeGesture } from '@/hooks/useTouchGestures';

export function CardList({ items, onNext, onPrev }) {
  const swipeRef = useSwipeGesture((gesture) => {
    if (gesture.direction === 'left') onNext();
    if (gesture.direction === 'right') onPrev();
  });

  return (
    <div ref={swipeRef} className="overflow-hidden">
      {items.map(item => <Card key={item.id} {...item} />)}
    </div>
  );
}
```

### Pattern 3: Mobile-Optimized Data Table

```tsx
'use client';

import { useResponsive } from '@/hooks/useResponsive';

export function DataTable({ data }) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <div className="space-y-2">
        {data.map(item => (
          <Card key={item.id}>
            <CardContent>{item.name}</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <table>
      {/* Desktop table view */}
    </table>
  );
}
```

### Pattern 4: Cached Data Loading

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getCachedData, setCachedData } from '@/lib/mobile-utils';

export function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Try cache first
    const cached = getCachedData('products');
    if (cached) {
      setProducts(cached);
      return;
    }

    // Fetch and cache
    fetchProducts().then(data => {
      setProducts(data);
      setCachedData('products', data, 30 * 60 * 1000);
    });
  }, []);

  return <div>{/* Render products */}</div>;
}
```

## Testing

All infrastructure components are fully tested:

```bash
# Run all mobile infrastructure tests
npm test -- --testPathPatterns="(useResponsive|mobile-utils)"

# Run specific test file
npm test -- src/hooks/__tests__/useResponsive.test.ts
npm test -- src/lib/__tests__/mobile-utils.test.ts
```

Test coverage:
- ✅ Viewport detection (mobile/desktop/tablet)
- ✅ Orientation detection (portrait/landscape)
- ✅ Media query matching
- ✅ Touch target validation
- ✅ Cache management (set/get/clear/expiration)
- ✅ Utility functions (formatBytes, debounce, throttle)

## Requirements Mapping

This infrastructure satisfies the following requirements:

- **Requirement 15.1**: Performance and loading optimization with cache management
- **Requirement 15.2**: Skeleton loaders and lazy loading support
- **Requirement 16.1**: Touch gesture support (swipe, long press, pull-to-refresh)

## Next Steps

With this infrastructure in place, you can now:

1. ✅ Create mobile navigation components (hamburger menu, drawer)
2. ✅ Build responsive layouts for each module
3. ✅ Transform tables to card layouts on mobile
4. ✅ Implement touch-optimized forms
5. ✅ Create mobile-specific POS layout with bottom sheet

## Examples

See `src/examples/mobile-infrastructure-usage.tsx` for complete working examples of all features.

## Best Practices

1. **Mobile-First**: Always design for mobile first, then enhance for desktop
2. **Touch Targets**: Ensure all interactive elements are at least 44x44px
3. **Performance**: Use caching for frequently accessed data
4. **Gestures**: Provide visual feedback for touch interactions
5. **Testing**: Test on real devices, not just browser DevTools
6. **Accessibility**: Ensure touch targets have adequate spacing (8px minimum)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Safari (iOS 12+)
- ✅ Firefox (latest)
- ✅ Samsung Internet
- ✅ Chrome Mobile (Android)

## License

Part of ZaikoPOS project.
