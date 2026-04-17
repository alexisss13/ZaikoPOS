/**
 * Mobile Infrastructure Usage Examples
 * 
 * This file demonstrates how to use the mobile responsive infrastructure
 * components created in Task 1.
 */

'use client';

import { useResponsive, useOrientation } from '@/hooks/useResponsive';
import { useTouchGestures, useSwipeGesture } from '@/hooks/useTouchGestures';
import { isMobileViewport, formatBytes, setCachedData, getCachedData } from '@/lib/mobile-utils';

/**
 * Example 1: Responsive Component
 * Shows different UI based on viewport size
 */
export function ResponsiveExample() {
  const { isMobile, isDesktop, width } = useResponsive();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Responsive Example</h2>
      <div className="space-y-2">
        <p>Current viewport: {width}px</p>
        <p>Device type: {isMobile ? 'Mobile' : 'Desktop'}</p>
        
        {isMobile ? (
          <div className="bg-blue-100 p-4 rounded">
            <p>Mobile-specific content</p>
            <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
              Mobile Action
            </button>
          </div>
        ) : (
          <div className="bg-green-100 p-4 rounded">
            <p>Desktop-specific content</p>
            <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
              Desktop Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 2: Orientation Detection
 * Adapts layout based on device orientation
 */
export function OrientationExample() {
  const orientation = useOrientation();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Orientation Example</h2>
      <p>Current orientation: {orientation}</p>
      
      <div className={orientation === 'landscape' ? 'flex flex-row gap-4' : 'flex flex-col gap-4'}>
        <div className="bg-purple-100 p-4 rounded flex-1">
          <p>Panel 1</p>
        </div>
        <div className="bg-purple-200 p-4 rounded flex-1">
          <p>Panel 2</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Swipe Gesture
 * Implements swipeable card navigation
 */
export function SwipeExample() {
  const swipeRef = useSwipeGesture((gesture) => {
    console.log('Swipe detected:', gesture.direction);
    
    if (gesture.direction === 'left') {
      console.log('Go to next item');
    } else if (gesture.direction === 'right') {
      console.log('Go to previous item');
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Swipe Gesture Example</h2>
      <div
        ref={swipeRef as React.RefObject<HTMLDivElement>}
        className="bg-yellow-100 p-8 rounded text-center cursor-pointer select-none"
      >
        <p>Swipe left or right on this card</p>
        <p className="text-sm text-gray-600 mt-2">
          (Check console for swipe events)
        </p>
      </div>
    </div>
  );
}

/**
 * Example 4: Touch Gestures (Multiple)
 * Demonstrates long press and swipe together
 */
export function MultiGestureExample() {
  const gestureRef = useTouchGestures({
    onSwipe: (gesture) => {
      console.log('Swipe:', gesture.direction);
    },
    onLongPress: (gesture) => {
      console.log('Long press detected');
      alert('Long press detected! This could open a context menu.');
    },
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Multi-Gesture Example</h2>
      <div
        ref={gestureRef as React.RefObject<HTMLDivElement>}
        className="bg-red-100 p-8 rounded text-center cursor-pointer select-none"
      >
        <p>Try swiping or long pressing this card</p>
        <p className="text-sm text-gray-600 mt-2">
          Long press will show an alert
        </p>
      </div>
    </div>
  );
}

/**
 * Example 5: Cache Management
 * Shows how to cache and retrieve data
 */
export function CacheExample() {
  const handleCacheData = () => {
    const products = [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 },
    ];
    
    // Cache for 5 minutes
    setCachedData('products', products, 5 * 60 * 1000);
    alert('Products cached!');
  };

  const handleRetrieveData = () => {
    const cached = getCachedData('products');
    
    if (cached) {
      console.log('Retrieved from cache:', cached);
      alert(`Found ${cached.length} products in cache`);
    } else {
      alert('No cached data found');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Cache Example</h2>
      <div className="space-x-2">
        <button
          onClick={handleCacheData}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Cache Data
        </button>
        <button
          onClick={handleRetrieveData}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Retrieve Data
        </button>
      </div>
    </div>
  );
}

/**
 * Example 6: Utility Functions
 * Demonstrates various mobile utility functions
 */
export function UtilityExample() {
  const isMobile = isMobileViewport();
  const fileSize = formatBytes(1536000);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Utility Functions Example</h2>
      <div className="space-y-2">
        <p>Is mobile viewport: {isMobile ? 'Yes' : 'No'}</p>
        <p>Formatted file size: {fileSize}</p>
        <p>Example: 1,536,000 bytes = {fileSize}</p>
      </div>
    </div>
  );
}

/**
 * Main Demo Component
 * Combines all examples
 */
export default function MobileInfrastructureDemo() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Mobile Infrastructure Examples
      </h1>
      
      <div className="space-y-8">
        <ResponsiveExample />
        <OrientationExample />
        <SwipeExample />
        <MultiGestureExample />
        <CacheExample />
        <UtilityExample />
      </div>
    </div>
  );
}
