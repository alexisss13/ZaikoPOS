'use client';

import { X, LucideIcon, ShoppingBag, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

/**
 * MenuItem Interface
 * Defines the structure of navigation items in the mobile menu
 */
export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

/**
 * User Interface
 * Defines user information displayed in the profile section
 */
export interface User {
  name: string;
  role: string;
  image?: string | null;
}

/**
 * MobileMenuDrawer Component Props
 * 
 * @param isOpen - Controls drawer visibility
 * @param onClose - Callback to close the drawer
 * @param menuItems - Array of navigation items to display
 * @param user - User information for profile section
 * @param onLogout - Callback when logout button is clicked
 * @param showPOSButton - Whether to show POS quick access button (hidden for SUPER_ADMIN)
 * @param isPOSActive - Whether POS route is currently active
 */
export interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  user: User;
  onLogout: () => void;
  showPOSButton?: boolean;
  isPOSActive?: boolean;
}

/**
 * MobileMenuDrawer Component
 * 
 * Mobile navigation drawer that slides in from the left side.
 * Features:
 * - User profile section at top with avatar and role
 * - Navigation items with icons and labels
 * - POS quick access button (role-based)
 * - Logout button at bottom
 * - Backdrop click-to-close functionality
 * - Smooth slide-in animation
 * - Touch-friendly 44x44px minimum targets
 * 
 * Visibility: < 768px only (mobile devices)
 * 
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**
 */
export function MobileMenuDrawer({
  isOpen,
  onClose,
  menuItems,
  user,
  onLogout,
  showPOSButton = true,
  isPOSActive = false,
}: MobileMenuDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop - Click to close */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Drawer Content */}
        <div className="flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
            <h2 className="text-sm font-bold text-slate-900">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Section */}
            <div className="px-4 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                {/* User Avatar */}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="px-4 py-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all min-h-[44px] ${
                    item.isActive
                      ? 'bg-slate-900 text-white font-bold shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={item.isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Action Area */}
          <div className="px-4 py-4 border-t border-slate-200 space-y-2 shrink-0">
            {/* POS Quick Access Button */}
            {showPOSButton && (
              <Link
                href="/dashboard/pos"
                onClick={onClose}
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold border transition-all min-h-[44px] ${
                  isPOSActive
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>IR AL POS</span>
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 font-bold transition-colors min-h-[44px]"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
