/**
 * Tests for mobile utility functions
 */

import {
  isTouchTargetValid,
  isMobileDevice,
  isTouchDevice,
  getViewportWidth,
  getViewportHeight,
  isMobileViewport,
  isDesktopViewport,
  setCachedData,
  getCachedData,
  clearCachedData,
  formatBytes,
  debounce,
  throttle,
  DEFAULT_TOUCH_TARGET,
} from '../mobile-utils';

describe('Touch Target Validation', () => {
  it('should validate touch target size correctly', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        right: 44,
        bottom: 44,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as HTMLElement;

    expect(isTouchTargetValid(mockElement)).toBe(true);
  });

  it('should reject small touch targets', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        width: 30,
        height: 30,
        top: 0,
        left: 0,
        right: 30,
        bottom: 30,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as HTMLElement;

    expect(isTouchTargetValid(mockElement)).toBe(false);
  });

  it('should use custom touch target config', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        width: 40,
        height: 40,
        top: 0,
        left: 0,
        right: 40,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as HTMLElement;

    const customConfig = { minWidth: 48, minHeight: 48, minSpacing: 8 };
    expect(isTouchTargetValid(mockElement, customConfig)).toBe(false);
  });
});

describe('Viewport Detection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  it('should get viewport width', () => {
    expect(getViewportWidth()).toBe(375);
  });

  it('should get viewport height', () => {
    expect(getViewportHeight()).toBe(667);
  });

  it('should detect mobile viewport', () => {
    expect(isMobileViewport()).toBe(true);
    expect(isDesktopViewport()).toBe(false);
  });

  it('should detect desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    expect(isMobileViewport()).toBe(false);
    expect(isDesktopViewport()).toBe(true);
  });
});

describe('Cache Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should cache and retrieve data', () => {
    const testData = { id: 1, name: 'Test Product' };
    setCachedData('test-key', testData, 60000);

    const retrieved = getCachedData('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for expired cache', () => {
    const testData = { id: 1, name: 'Test Product' };
    setCachedData('test-key', testData, -1000); // Already expired

    const retrieved = getCachedData('test-key');
    expect(retrieved).toBeNull();
  });

  it('should clear specific cache entry', () => {
    setCachedData('test-key', { data: 'test' }, 60000);
    clearCachedData('test-key');

    const retrieved = getCachedData('test-key');
    expect(retrieved).toBeNull();
  });
});

describe('Utility Functions', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536000)).toBe('1.46 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should debounce function calls', (done) => {
    let callCount = 0;
    const debouncedFn = debounce(() => {
      callCount++;
    }, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(callCount).toBe(0);

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 150);
  });

  it('should throttle function calls', (done) => {
    let callCount = 0;
    const throttledFn = throttle(() => {
      callCount++;
    }, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(callCount).toBe(1);

    setTimeout(() => {
      throttledFn();
      expect(callCount).toBe(2);
      done();
    }, 150);
  });
});

describe('Constants', () => {
  it('should have correct default touch target config', () => {
    expect(DEFAULT_TOUCH_TARGET).toEqual({
      minWidth: 44,
      minHeight: 44,
      minSpacing: 8,
    });
  });
});
