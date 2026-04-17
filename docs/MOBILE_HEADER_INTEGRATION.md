# MobileHeader Integration Guide

This guide explains how to integrate the new `MobileHeader` component into the existing dashboard layout.

## Overview

The `MobileHeader` component has been created as part of Task 2.1 of the mobile-responsive-design spec. It provides a mobile-optimized header that is visible only on devices with viewport width < 768px.

## Component Location

```
src/components/layout/MobileHeader.tsx
```

## Current Implementation Status

✅ **Completed:**
- MobileHeader component created with all required features
- Logo/brand name display
- Notification bell with badge
- Hamburger menu button
- 44x44px minimum touch targets
- Responsive visibility (md:hidden)
- Comprehensive test coverage (19 tests passing)
- TypeScript types exported
- Documentation and examples

## Integration Steps

### Option 1: Replace Existing Mobile Header (Recommended)

The dashboard layout (`src/app/(dashboard)/layout.tsx`) already has a mobile header implementation. You can replace it with the new component:

**Before (lines ~247-262):**
```tsx
<header className="lg:hidden h-14 bg-white text-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm border-b border-slate-200 z-30">
  <div className="flex items-center gap-2">
    <div className="bg-slate-900 p-1.5 rounded shadow-sm"><Store className="h-4 w-4 text-white" /></div>
    <span className="font-bold text-sm text-slate-900">F&F ADMIN</span>
  </div>
  <div className="flex items-center gap-2">
    <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
    </button>
    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:bg-slate-100 h-9 w-9 rounded-full">
      {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </Button>
  </div>
</header>
```

**After:**
```tsx
import { MobileHeader } from '@/components/layout';

// In the component:
<MobileHeader 
  onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  notificationCount={unreadCount}
  onNotificationClick={() => setShowNotifs(!showNotifs)}
  brandLogo={currentBranch?.logoUrl}
  brandName={role === 'SUPER_ADMIN' ? 'F&F ADMIN' : currentBranch?.name}
/>
```

### Option 2: Side-by-Side Testing

Keep both implementations temporarily for testing:

```tsx
{/* New MobileHeader Component */}
<MobileHeader 
  onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  notificationCount={unreadCount}
  onNotificationClick={() => setShowNotifs(!showNotifs)}
  brandName="F&F ADMIN"
/>

{/* Old implementation (can be removed after testing) */}
{/* <header className="lg:hidden ...">...</header> */}
```

## Props Mapping

The new component accepts these props that map to existing layout state:

| MobileHeader Prop | Layout State/Value | Description |
|-------------------|-------------------|-------------|
| `onMenuToggle` | `() => setIsMobileMenuOpen(!isMobileMenuOpen)` | Toggle mobile menu drawer |
| `notificationCount` | `unreadCount` | Number from notifications array |
| `onNotificationClick` | `() => setShowNotifs(!showNotifs)` | Toggle notifications panel |
| `brandLogo` | `currentBranch?.logoUrl` | Branch logo (optional) |
| `brandName` | `'F&F ADMIN'` or `currentBranch?.name` | Display name |

## Benefits of Using MobileHeader Component

1. **Separation of Concerns**: Mobile header logic is isolated in its own component
2. **Reusability**: Can be used in other layouts if needed
3. **Testability**: 19 comprehensive tests ensure reliability
4. **Maintainability**: Easier to update mobile header without touching layout
5. **Type Safety**: Full TypeScript support with exported interfaces
6. **Accessibility**: Built-in ARIA labels and semantic HTML
7. **Touch Optimization**: Guaranteed 44x44px touch targets

## Requirements Satisfied

✅ **Requirement 1.1**: Mobile Navigation - Hamburger menu accessible  
✅ **Requirement 1.9**: Touch Target Size - 44x44px minimum  
✅ **Requirement 18.1**: Accessibility - All touch targets meet standards

## Testing

After integration, verify:

1. **Mobile viewport (< 768px)**:
   - Header is visible
   - Hamburger menu button works
   - Notification bell works
   - Touch targets are easy to tap
   - Brand logo/name displays correctly

2. **Desktop viewport (>= 768px)**:
   - Header is hidden (md:hidden class)
   - Sidebar navigation is visible
   - No layout shifts

3. **Functionality**:
   - Menu toggle callback fires
   - Notification click callback fires
   - Notification badge shows correct count
   - Custom branding displays when provided

## Next Steps

After integrating MobileHeader, the next components to implement are:

1. **Task 2.2**: MobileMenuDrawer component (slide-in navigation)
2. **Task 2.3**: Update layout.tsx to use both components
3. **Task 3.x**: Responsive page layouts for each module

## Support

For questions or issues:
- Review `src/components/layout/README.md`
- Check examples in `src/components/layout/MobileHeader.example.tsx`
- Run tests: `npm test -- src/components/layout --no-watch`
