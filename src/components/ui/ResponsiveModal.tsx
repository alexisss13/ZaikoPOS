'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * ResponsiveModal Component
 * 
 * A modal dialog that adapts to viewport size:
 * - Full-screen on mobile (< 768px)
 * - Centered dialog on desktop (>= 768px)
 * 
 * Features:
 * - Sticky header and footer during scroll
 * - 44x44px minimum touch target for close button
 * - Backdrop tap-to-close with optional confirmation
 * - Smooth animations
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7**
 */

interface ResponsiveModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size on desktop (ignored on mobile) */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Force full-screen mode even on desktop */
  mobileFullScreen?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Confirm before closing if form has changes */
  confirmOnClose?: boolean;
  /** Custom confirmation message */
  confirmMessage?: string;
  /** Additional className for content */
  className?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  mobileFullScreen = true,
  showCloseButton = true,
  confirmOnClose = false,
  confirmMessage = '¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.',
  className,
}: ResponsiveModalProps) {
  const { isMobile } = useResponsive();

  const handleClose = React.useCallback(() => {
    if (confirmOnClose) {
      if (window.confirm(confirmMessage)) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [confirmOnClose, confirmMessage, onClose]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Size classes for desktop
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:m-4',
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop - Requirement 8.7: Tappable to close */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Modal Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-background shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            // Mobile: Full-screen with 8px margins (Requirement 8.1, 8.2)
            isMobile && mobileFullScreen
              ? 'inset-2 rounded-lg flex flex-col'
              : // Desktop: Centered dialog
                cn(
                  'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
                  'max-h-[90vh] w-[calc(100%-2rem)] rounded-lg',
                  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                  'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
                  'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
                  sizeClasses[size]
                ),
            className
          )}
        >
          {/* Header - Requirement 8.3: Sticky at top */}
          {(title || showCloseButton) && (
            <div
              className={cn(
                'flex items-center justify-between border-b px-4 py-3',
                'sticky top-0 z-10 bg-background',
                isMobile && 'min-h-[56px]' // Ensure adequate touch target height
              )}
            >
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold">
                  {title}
                </DialogPrimitive.Title>
              )}

              {/* Close Button - Requirement 8.5: 44x44px minimum, top-right */}
              {showCloseButton && (
                <DialogPrimitive.Close
                  className={cn(
                    'rounded-sm opacity-70 transition-opacity hover:opacity-100',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'disabled:pointer-events-none',
                    // Requirement 8.5: Minimum 44x44px touch target
                    'min-w-[44px] min-h-[44px] flex items-center justify-center',
                    !title && 'ml-auto' // Right-align if no title
                  )}
                >
                  <XIcon className="h-5 w-5" />
                  <span className="sr-only">Cerrar</span>
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          {/* Scrollable Content Area */}
          <div
            className={cn(
              'overflow-y-auto',
              isMobile && mobileFullScreen ? 'flex-1' : 'max-h-[calc(90vh-8rem)]'
            )}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * ResponsiveModalHeader
 * 
 * Optional header component for modal content
 */
export function ResponsiveModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-2 px-4 py-4', className)}
      {...props}
    />
  );
}

/**
 * ResponsiveModalBody
 * 
 * Body component for modal content with consistent padding
 */
export function ResponsiveModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-4', className)} {...props} />;
}

/**
 * ResponsiveModalFooter
 * 
 * Footer component with sticky positioning (Requirement 8.4)
 */
export function ResponsiveModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = useResponsive();

  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t px-4 py-3',
        'sm:flex-row sm:justify-end',
        // Requirement 8.4: Sticky at bottom during scroll
        'sticky bottom-0 z-10 bg-background',
        isMobile && 'min-h-[60px]', // Ensure adequate touch target height
        className
      )}
      {...props}
    />
  );
}

/**
 * ResponsiveModalDescription
 * 
 * Description text component for modal
 */
export function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
