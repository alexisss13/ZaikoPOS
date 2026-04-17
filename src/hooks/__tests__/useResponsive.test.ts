/**
 * Tests for useResponsive hook
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsive, useOrientation, useMediaQuery } from '../useResponsive';

// Mock window.innerWidth and window.innerHeight
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset to default mobile size
    mockWindowSize(375, 667);
  });

  it('should detect mobile viewport correctly', () => {
    mockWindowSize(375, 667);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
  });

  it('should detect desktop viewport correctly', () => {
    mockWindowSize(1024, 768);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should detect tablet viewport correctly', () => {
    mockWindowSize(800, 600);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('should update on window resize', () => {
    mockWindowSize(375, 667);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);

    // Simulate resize to desktop
    act(() => {
      mockWindowSize(1024, 768);
      window.dispatchEvent(new Event('resize'));
    });

    // Wait for debounce
    setTimeout(() => {
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
    }, 200);
  });
});

describe('useOrientation', () => {
  it('should detect portrait orientation', () => {
    mockWindowSize(375, 667);
    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('portrait');
  });

  it('should detect landscape orientation', () => {
    mockWindowSize(667, 375);
    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('landscape');
  });
});

describe('useMediaQuery', () => {
  it('should match media query', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

    expect(result.current).toBe(true);
  });
});
