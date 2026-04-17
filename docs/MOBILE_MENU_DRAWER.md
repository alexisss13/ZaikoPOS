# MobileMenuDrawer Component Documentation

## Overview

The `MobileMenuDrawer` component is a mobile-optimized navigation drawer that slides in from the left side of the screen. It provides a complete navigation experience for mobile users with user profile display, navigation items, POS quick access, and logout functionality.

## Features

- ✅ **Slide-in Animation**: Smooth slide-in from left with backdrop overlay
- ✅ **User Profile Section**: Displays user avatar, name, and role at the top
- ✅ **Navigation Items**: Shows all menu items with icons and labels
- ✅ **Active State**: Highlights the currently active navigation item
- ✅ **POS Quick Access**: Optional quick access button for POS module
- ✅ **Logout Button**: Prominent logout button at the bottom
- ✅ **Backdrop Click-to-Close**: Closes drawer when backdrop is clicked
- ✅ **Keyboard Support**: Closes drawer with Escape key
- ✅ **Touch-Friendly**: All interactive elements meet 44x44px minimum touch target
- ✅ **Body Scroll Lock**: Prevents background scrolling when drawer is open
- ✅ **Accessibility**: Proper ARIA attributes and semantic HTML

## Requirements Validation

This component validates the following requirements from the mobile-responsive-design spec:

- **Requirement 1.2**: Mobile menu accessible through hamburger menu
- **Requirement 1.3**: Navigation items with icons and labels clearly visible
- **Requirement 1.4**: User profile information at the top
- **Requirement 1.5**: POS quick access button (role-based)
- **Requirement 1.6**: Logout button at the bottom
- **Requirement 1.7**: Backdrop click-to-close functionality

## Installation

The component is located at `src/components/layout/MobileMenuDrawer.tsx` and requires the following dependencies:

```bash
npm install lucide-react
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { MobileMenuDrawer, MenuItem, User } from '@/components/layout/MobileMenuDrawer';
import { LayoutDashboard, Package, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

function MyLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const user: User = {
    name: 'John Doe',
    role: 'MANAGER',
    image: 'https://example.com/avatar.jpg',
  };

  const menuItems: MenuItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/dashboard/products',
      label: 'Products',
      icon: Package,
      isActive: pathname === '/dashboard/products',
    },
    {
      href: '/dashboard/users',
      label: 'Users',
      icon: Users,
      isActive: pathname === '/dashboard/users',
    },
  ];

  const handleLogout = async () => {
    // Implement logout logic
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        user={user}
        onLogout={handleLogout}
        showPOSButton={true}
        isPOSActive={pathname === '/dashboard/pos'}
      />
      
      {/* Your page content */}
    </>
  );
}
```

### Integration with MobileHeader

```tsx
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileMenuDrawer } from '@/components/layout/MobileMenuDrawer';

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header with hamburger button */}
      <MobileHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={3}
        brandName="My App"
      />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Role-Based Menu Items

```tsx
function getRoleBasedMenuItems(role: string, pathname: string): MenuItem[] {
  if (role === 'SUPER_ADMIN') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isActive: pathname === '/dashboard' },
      { href: '/dashboard/businesses', label: 'Businesses', icon: Building2, isActive: pathname === '/dashboard/businesses' },
      { href: '/dashboard/branches', label: 'Branches', icon: Store, isActive: pathname === '/dashboard/branches' },
      { href: '/dashboard/users', label: 'Users', icon: Users, isActive: pathname === '/dashboard/users' },
    ];
  }

  // Regular user menu items
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isActive: pathname === '/dashboard' },
    { href: '/dashboard/products', label: 'Products', icon: Package, isActive: pathname === '/dashboard/products' },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Warehouse, isActive: pathname === '/dashboard/inventory' },
  ];
}

// Usage
const menuItems = getRoleBasedMenuItems(user.role, pathname);

<MobileMenuDrawer
  menuItems={menuItems}
  showPOSButton={user.role !== 'SUPER_ADMIN'}
  // ... other props
/>
```

## Props

### MobileMenuDrawerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls drawer visibility |
| `onClose` | `() => void` | Yes | - | Callback when drawer should close |
| `menuItems` | `MenuItem[]` | Yes | - | Array of navigation items |
| `user` | `User` | Yes | - | User information for profile section |
| `onLogout` | `() => void` | Yes | - | Callback when logout button is clicked |
| `showPOSButton` | `boolean` | No | `true` | Whether to show POS quick access button |
| `isPOSActive` | `boolean` | No | `false` | Whether POS route is currently active |

### MenuItem Interface

```typescript
interface MenuItem {
  href: string;        // Navigation URL
  label: string;       // Display text
  icon: LucideIcon;    // Icon component from lucide-react
  isActive: boolean;   // Whether this item is currently active
}
```

### User Interface

```typescript
interface User {
  name: string;        // User's full name
  role: string;        // User's role (e.g., 'MANAGER', 'CASHIER')
  image?: string | null; // Optional avatar URL
}
```

## Styling

The component uses Tailwind CSS classes and follows the application's design system:

- **Drawer Width**: 280px
- **Animation Duration**: 300ms
- **Backdrop**: Black with 50% opacity
- **Active Item**: Slate-900 background with white text
- **POS Button**: Emerald-600 when active, emerald-50 when inactive
- **Touch Targets**: Minimum 44x44px for all interactive elements

### Customization

The component's styling can be customized by modifying the Tailwind classes in the component file. Key areas:

- Drawer width: `w-[280px]`
- Background color: `bg-white`
- Active item color: `bg-slate-900 text-white`
- POS button color: `bg-emerald-600` (active) / `bg-emerald-50` (inactive)

## Accessibility

The component follows accessibility best practices:

- **ARIA Attributes**: `role="dialog"`, `aria-modal="true"`, `aria-label`
- **Keyboard Navigation**: Escape key closes the drawer
- **Focus Management**: Proper focus handling when drawer opens/closes
- **Screen Reader Support**: Descriptive labels for all interactive elements
- **Touch Targets**: All interactive elements meet 44x44px minimum size

## Browser Support

The component works in all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Animation**: Uses CSS transforms for smooth 60fps animations
- **Body Scroll Lock**: Prevents background scrolling when drawer is open
- **Event Cleanup**: Properly removes event listeners on unmount
- **Lazy Rendering**: Drawer content is always rendered but hidden off-screen

## Testing

The component includes comprehensive unit tests covering:

- Slide-in animation behavior
- Navigation item rendering and interaction
- User profile display
- POS button visibility and state
- Logout functionality
- Backdrop click-to-close
- Keyboard support (Escape key)
- Touch target sizes
- Accessibility attributes
- Body scroll prevention

Run tests with:

```bash
npm test -- src/components/layout/MobileMenuDrawer.test.tsx
```

## Related Components

- **MobileHeader**: Mobile header with hamburger menu button
- **Button**: UI button component used for interactive elements
- **Link**: Next.js Link component for navigation

## Examples

See `src/components/layout/MobileMenuDrawer.example.tsx` for complete usage examples including:

- Basic integration
- Role-based menu items
- Auth context integration
- Custom styling

## Troubleshooting

### Drawer doesn't close when clicking backdrop

Ensure the `onClose` callback is properly connected:

```tsx
<MobileMenuDrawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)} // ✅ Correct
  // ... other props
/>
```

### Navigation items not highlighting

Make sure `isActive` is set correctly based on current pathname:

```tsx
const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    isActive: pathname === '/dashboard', // ✅ Compare with current path
  },
];
```

### User avatar not displaying

Check that the image URL is valid and accessible:

```tsx
const user = {
  name: 'John Doe',
  role: 'MANAGER',
  image: 'https://example.com/avatar.jpg', // ✅ Valid URL
};
```

If no image is provided, the component will show a fallback icon.

## Future Enhancements

Potential improvements for future versions:

- Swipe gesture to open/close drawer
- Nested menu items support
- Custom footer content slot
- Theme customization props
- Animation configuration options
- Drawer position (left/right)

## License

This component is part of the ZaikoPOS application.
