# Design Document: Mobile Responsive Design

## Overview

This design implements complete mobile responsiveness for the ZaikoPOS web application, transforming the desktop-optimized interface into a mobile-first experience without losing functionality. The solution uses Tailwind CSS breakpoints (md: 768px) to conditionally render mobile-optimized components while preserving the existing desktop design.

The core strategy involves:
- Responsive navigation with hamburger menu and slide-in drawer for mobile
- Layout transformations from multi-column to stacked layouts
- Table-to-card conversions for data-heavy views
- Touch-optimized components with 44x44px minimum targets
- Mobile-specific POS layout with floating cart and bottom sheet
- Performance optimizations including lazy loading and caching
- Gesture support for native mobile interactions

The implementation will be incremental, starting with the navigation shell and progressively enhancing each module (Dashboard, Products, Inventory, POS, Purchases, Users, Branches, Cash Sessions, Audit) with mobile-specific adaptations.

## Architecture

### Component Hierarchy

```
App Shell (layout.tsx)
├── Mobile Navigation System
│   ├── Mobile Header (visible < 768px)
│   │   ├── Logo/Brand
│   │   ├── Notification Bell
│   │   └── Hamburger Menu Button
│   ├── Mobile Menu Drawer (slide-in from left)
│   │   ├── User Profile Section
│   │   ├── Navigation Items
│   │   ├── POS Quick Access
│   │   └── Logout Button
│   └── Desktop Sidebar (visible >= 768px, unchanged)
│
├── Responsive Page Layouts
│   ├── Dashboard Module
│   │   ├── Stats Cards (stacked on mobile)
│   │   └── Charts (scaled proportionally)
│   ├── Products Module
│   │   ├── Product Grid (2 columns mobile, 4 desktop)
│   │   ├── Search & Filters (mobile-optimized)
│   │   └── Product Cards (touch-friendly)
│   ├── Inventory Module
│   │   ├── Table → Card Layout Transform
│   │   └── Stock Adjustment Controls
│   ├── POS Module
│   │   ├── Mobile Layout (stacked)
│   │   ├── Floating Cart Button
│   │   └── Bottom Sheet Cart
│   └── [Other Modules...]
│
└── Shared Responsive Components
    ├── ResponsiveTable (transforms to cards)
    ├── ResponsiveModal (full-screen on mobile)
    ├── ResponsiveForm (stacked fields)
    ├── TouchButton (44x44px minimum)
    └── BottomSheet (mobile-specific)
```

### State Management

The application uses existing patterns:
- **SWR** for data fetching and caching (already implemented)
- **React useState** for local component state
- **Zustand** (if needed) for cross-component mobile UI state
- **Auth Context** for user permissions (already implemented)

Mobile-specific state additions:
- `isMobileMenuOpen`: Controls hamburger menu visibility
- `isBottomSheetOpen`: Controls POS cart bottom sheet
- `activeFilters`: Mobile filter panel state
- `touchGestures`: Gesture recognition state

### Responsive Breakpoint Strategy

Using Tailwind CSS breakpoints:
- **Mobile**: < 768px (default, mobile-first)
- **Desktop**: >= 768px (md: prefix)

Implementation pattern:
```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row">
  {/* Stacked on mobile, row on desktop */}
</div>

// Conditional rendering for complex differences
{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

## Components and Interfaces

### 1. Mobile Navigation System

#### MobileHeader Component
```typescript
interface MobileHeaderProps {
  onMenuToggle: () => void;
  notificationCount: number;
  brandLogo?: string;
}

// Location: src/components/layout/MobileHeader.tsx
// Renders: Logo, Notification Bell, Hamburger Menu
// Visibility: < 768px only
```

#### MobileMenuDrawer Component
```typescript
interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  user: User;
  onLogout: () => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

// Location: src/components/layout/MobileMenuDrawer.tsx
// Animation: Slide-in from left with backdrop
// Features: User profile, navigation, logout
```

### 2. Responsive Table Component

#### ResponsiveTable Component
```typescript
interface ResponsiveTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  mobileCardRenderer: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

interface ColumnDef<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  mobileVisible?: boolean; // Show in mobile card
}

// Location: src/components/ui/ResponsiveTable.tsx
// Behavior: Table on desktop, cards on mobile
// Features: Pagination, sorting, filtering
```

### 3. Mobile POS Components

#### FloatingCartButton Component
```typescript
interface FloatingCartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

// Location: src/components/pos/FloatingCartButton.tsx
// Position: Fixed bottom-right on mobile
// Visibility: Mobile only, when cart has items
```

#### BottomSheet Component
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'half' | 'full';
}

// Location: src/components/ui/BottomSheet.tsx
// Animation: Slide up from bottom
// Features: Swipe-down to close, backdrop
// Usage: Cart, filters, quick actions
```

### 4. Responsive Modal Component

#### ResponsiveModal Component
```typescript
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  mobileFullScreen?: boolean;
}

// Location: src/components/ui/ResponsiveModal.tsx
// Behavior: Full-screen on mobile, centered on desktop
// Features: Sticky header/footer, scrollable content
```

### 5. Touch-Optimized Components

#### TouchButton Component
```typescript
interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

// Location: src/components/ui/TouchButton.tsx
// Minimum size: 44x44px on mobile
// Features: Active state feedback, haptic-like animation
```

### 6. Mobile Form Components

#### ResponsiveForm Component
```typescript
interface ResponsiveFormProps {
  onSubmit: (data: any) => void;
  fields: FormField[];
  isLoading?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | undefined;
}

// Location: src/components/ui/ResponsiveForm.tsx
// Layout: Stacked on mobile, 2-column on desktop
// Features: 44px input height, native selects on mobile
```

## Data Models

No new database models are required. This feature only modifies the presentation layer. However, we'll add client-side interfaces for mobile-specific state:

```typescript
// src/types/mobile.ts

interface MobileUIState {
  isMobileMenuOpen: boolean;
  activeBottomSheet: 'cart' | 'filters' | null;
  touchGestureEnabled: boolean;
  orientation: 'portrait' | 'landscape';
}

interface ResponsiveBreakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'longpress' | 'pull';
  direction?: 'up' | 'down' | 'left' | 'right';
  target: HTMLElement;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresIn: number;
}
```

