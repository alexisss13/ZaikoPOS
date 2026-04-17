/**
 * MobileHeader Component - Usage Examples
 * 
 * This file demonstrates how to integrate the MobileHeader component
 * into your application layout.
 */

import { useState } from 'react';
import { MobileHeader } from './MobileHeader';

/**
 * Example 1: Basic Usage
 * Minimal setup with required props only
 */
export function BasicMobileHeaderExample() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <MobileHeader 
      onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
    />
  );
}

/**
 * Example 2: With Notifications
 * Shows notification count badge
 */
export function MobileHeaderWithNotifications() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <MobileHeader 
      onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      notificationCount={5}
      onNotificationClick={() => setShowNotifications(!showNotifications)}
    />
  );
}

/**
 * Example 3: Custom Branding
 * Uses custom logo and brand name
 */
export function MobileHeaderWithCustomBranding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <MobileHeader 
      onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      brandLogo="https://example.com/logo.png"
      brandName="My Company"
      notificationCount={3}
      onNotificationClick={() => console.log('Notifications clicked')}
    />
  );
}

/**
 * Example 4: Integration with Layout
 * Full example showing MobileHeader in a layout context
 */
export function LayoutWithMobileHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 7;

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header - visible only on mobile (< 768px) */}
      <MobileHeader 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={unreadCount}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
        brandName="ZaikoPOS"
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <h1>Page Content</h1>
        <p>Your page content goes here...</p>
      </main>

      {/* Mobile Menu Drawer (to be implemented separately) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Content */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white">
            {/* Menu items go here */}
          </div>
        </div>
      )}

      {/* Notifications Panel (to be implemented separately) */}
      {showNotifications && (
        <div className="fixed top-14 right-2 w-80 bg-white shadow-xl rounded-lg z-40 md:hidden">
          {/* Notification items go here */}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: With Dynamic Brand Logo
 * Shows how to handle conditional logo display based on user role
 */
export function MobileHeaderWithDynamicBranding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Example: Get user role and branch data
  const userRole = 'MANAGER' as 'MANAGER' | 'SUPER_ADMIN'; // Could be from auth context
  const branchLogo = 'https://example.com/branch-logo.png';

  const getBrandLogo = () => {
    if (userRole === 'SUPER_ADMIN') {
      return undefined; // Use default icon
    }
    return branchLogo;
  };

  const getBrandName = () => {
    if (userRole === 'SUPER_ADMIN') {
      return 'Admin Panel';
    }
    return 'Branch Name';
  };

  return (
    <MobileHeader 
      onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      brandLogo={getBrandLogo()}
      brandName={getBrandName()}
      notificationCount={2}
    />
  );
}
