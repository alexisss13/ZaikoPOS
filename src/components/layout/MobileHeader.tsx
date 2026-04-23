'use client';

import { Notification01Icon, Menu01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

/**
 * MobileHeader Component Props
 * 
 * @param onMenuToggle - Callback to open/close mobile menu drawer
 * @param notificationCount - Number of unread notifications
 * @param onNotificationClick - Callback when notification bell is clicked
 * @param brandLogo - Optional brand logo URL
 * @param brandName - Brand name to display
 */
export interface MobileHeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  brandLogo?: string;
  brandName?: string;
}

/**
 * MobileHeader Component
 * 
 * Mobile-only header component that displays:
 * - Brand logo/name
 * - Notification bell with unread count badge
 * - Hamburger menu button
 * 
 * Visibility: < 768px only (hidden on desktop)
 * Touch targets: All interactive elements are 44x44px minimum
 */

export function MobileHeader({
  onMenuToggle,
  notificationCount = 0,
  onNotificationClick,
  brandLogo,
  brandName = 'F&F ADMIN',
}: MobileHeaderProps) {
  return (
    <header className="md:hidden h-14 bg-white text-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm border-b border-slate-200 z-30">
      {/* Left: Brand Logo/Name */}
      <div className="flex items-center gap-2">
        {brandLogo ? (
          <div className="w-8 h-8 rounded overflow-hidden shadow-sm">
            <img 
              src={brandLogo} 
              alt={brandName} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="bg-slate-900 p-1.5 rounded shadow-sm">
            <svg 
              className="h-4 w-4 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
          </div>
        )}
        <span className="font-bold text-sm text-slate-900">{brandName}</span>
      </div>

      {/* Right: Notification Bell + Hamburger Menu */}
      <div className="flex items-center gap-2">
        {/* Notification Bell - 44x44px touch target */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Notification01Icon className="w-5 h-5" />
          {notificationCount > 0 && (
            <span 
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"
              aria-label={`${notificationCount} unread notifications`}
            />
          )}
        </button>

        {/* Hamburger Menu Button - 44x44px touch target */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="text-slate-600 hover:bg-slate-100 min-w-[44px] min-h-[44px] rounded-full"
          aria-label="Open menu"
        >
          <Menu01Icon className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
