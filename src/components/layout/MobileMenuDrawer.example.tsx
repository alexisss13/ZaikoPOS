/**
 * MobileMenuDrawer Component - Usage Examples
 * 
 * This file demonstrates how to integrate the MobileMenuDrawer component
 * into your application layout.
 */

'use client';

import { useState } from 'react';
import { MobileMenuDrawer, MenuItem, User } from './MobileMenuDrawer';
import { MobileHeader } from './MobileHeader';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Store, 
  ShoppingCart,
  Warehouse 
} from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * Example 1: Basic Integration
 * 
 * Shows how to integrate MobileMenuDrawer with MobileHeader
 * in a dashboard layout.
 */
export function BasicExample() {
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
      label: 'Resumen',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/dashboard/products',
      label: 'Productos',
      icon: Package,
      isActive: pathname === '/dashboard/products',
    },
    {
      href: '/dashboard/inventory',
      label: 'Inventario',
      icon: Warehouse,
      isActive: pathname === '/dashboard/inventory',
    },
    {
      href: '/dashboard/users',
      label: 'Usuarios',
      icon: Users,
      isActive: pathname === '/dashboard/users',
    },
  ];

  const handleLogout = async () => {
    // Implement logout logic
    console.log('Logging out...');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header */}
      <MobileHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={3}
        onNotificationClick={() => console.log('Notifications clicked')}
        brandName="My App"
      />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        user={user}
        onLogout={handleLogout}
        showPOSButton={true}
        isPOSActive={pathname === '/dashboard/pos'}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <h1>Dashboard Content</h1>
      </main>
    </div>
  );
}

/**
 * Example 2: Role-Based Menu Items
 * 
 * Shows how to conditionally render menu items based on user role.
 */
export function RoleBasedExample() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const user: User = {
    name: 'Admin User',
    role: 'SUPER_ADMIN',
  };

  // Different menu items for SUPER_ADMIN
  const adminMenuItems: MenuItem[] = [
    {
      href: '/dashboard',
      label: 'Resumen',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/dashboard/businesses',
      label: 'Clientes',
      icon: Store,
      isActive: pathname === '/dashboard/businesses',
    },
    {
      href: '/dashboard/branches',
      label: 'Sucursales',
      icon: Store,
      isActive: pathname === '/dashboard/branches',
    },
    {
      href: '/dashboard/users',
      label: 'Usuarios',
      icon: Users,
      isActive: pathname === '/dashboard/users',
    },
  ];

  const handleLogout = async () => {
    console.log('Admin logging out...');
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={0}
        brandName="Admin Panel"
      />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={adminMenuItems}
        user={user}
        onLogout={handleLogout}
        showPOSButton={false} // Hide POS button for SUPER_ADMIN
      />

      <main className="flex-1 overflow-y-auto p-4">
        <h1>Admin Dashboard</h1>
      </main>
    </div>
  );
}

/**
 * Example 3: Integration with Auth Context
 * 
 * Shows how to integrate with an authentication context.
 */
export function AuthContextExample() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // In real app, get these from auth context
  // const { user, role, logout } = useAuth();
  
  const user: User = {
    name: 'Jane Smith',
    role: 'CASHIER',
    image: null, // Will show fallback icon
  };

  const menuItems: MenuItem[] = [
    {
      href: '/dashboard',
      label: 'Resumen',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/dashboard/products',
      label: 'Productos',
      icon: Package,
      isActive: pathname === '/dashboard/products',
    },
    {
      href: '/dashboard/inventory',
      label: 'Inventario',
      icon: Warehouse,
      isActive: pathname === '/dashboard/inventory',
    },
  ];

  const handleLogout = async () => {
    // Call auth context logout
    // await logout();
    console.log('Logging out...');
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={5}
        onNotificationClick={() => console.log('Show notifications')}
        brandName="ZaikoPOS"
      />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        user={user}
        onLogout={handleLogout}
        showPOSButton={true}
        isPOSActive={pathname === '/dashboard/pos'}
      />

      <main className="flex-1 overflow-y-auto p-4">
        <h1>Cashier Dashboard</h1>
      </main>
    </div>
  );
}

/**
 * Example 4: Custom Styling
 * 
 * Shows how the component can be customized while maintaining
 * the core functionality.
 */
export function CustomStylingExample() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const user: User = {
    name: 'Custom User',
    role: 'OWNER',
    image: 'https://example.com/custom-avatar.jpg',
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
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <MobileHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={0}
        brandName="Custom Brand"
        brandLogo="https://example.com/logo.png"
      />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        user={user}
        onLogout={() => console.log('Logout')}
        showPOSButton={true}
      />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1>Custom Styled Content</h1>
        </div>
      </main>
    </div>
  );
}
