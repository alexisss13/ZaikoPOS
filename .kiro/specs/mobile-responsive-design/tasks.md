# Implementation Plan: Mobile Responsive Design

## Overview

This plan implements complete mobile responsiveness for ZaikoPOS using a mobile-first approach with Tailwind CSS breakpoints (md: 768px). The implementation is incremental, starting with core navigation and layout infrastructure, then progressively enhancing each module with mobile-specific adaptations. All changes preserve the existing desktop design while adding mobile optimizations.

## Tasks

- [x] 1. Set up mobile responsive infrastructure
  - Create shared TypeScript interfaces for mobile UI state in `src/types/mobile.ts`
  - Create custom hook `useResponsive` in `src/hooks/useResponsive.ts` to detect viewport size
  - Create custom hook `useTouchGestures` in `src/hooks/useTouchGestures.ts` for gesture support
  - Set up mobile-specific utility functions in `src/lib/mobile-utils.ts`
  - _Requirements: 15.1, 15.2, 16.1_

- [x] 2. Implement mobile navigation system
  - [x] 2.1 Create MobileHeader component
    - Create `src/components/layout/MobileHeader.tsx` with logo, notification bell, and hamburger menu
    - Implement 44x44px minimum touch targets for all interactive elements
    - Add visibility control (visible < 768px only)
    - _Requirements: 1.1, 1.9, 18.1_

  - [x] 2.2 Create MobileMenuDrawer component
    - Create `src/components/layout/MobileMenuDrawer.tsx` with slide-in animation
    - Implement user profile section at top with avatar and role display
    - Add navigation items with icons and labels
    - Add POS quick access button and logout button at bottom
    - Implement backdrop click-to-close functionality
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.3 Integrate mobile navigation into layout
    - Modify `src/app/(dashboard)/layout.tsx` to conditionally render mobile vs desktop navigation
    - Add state management for mobile menu open/close
    - Implement role-based menu filtering for mobile
    - Ensure desktop sidebar remains unchanged (>= 768px)
    - _Requirements: 1.1, 1.8, 20.3_

- [-] 3. Create responsive UI component library
  - [x] 3.1 Create ResponsiveTable component
    - Create `src/components/ui/ResponsiveTable.tsx` that transforms table to cards on mobile
    - Implement card layout with key information prominently displayed
    - Add tap-to-expand functionality for full details
    - Support pagination with touch-friendly controls
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_

  - [x] 3.2 Create ResponsiveModal component
    - Create `src/components/ui/ResponsiveModal.tsx` with full-screen mobile mode
    - Implement sticky header and footer for mobile
    - Add 44x44px close button in top-right corner
    - Support backdrop tap-to-close with confirmation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

  - [~] 3.3 Create BottomSheet component
    - Create `src/components/ui/BottomSheet.tsx` with slide-up animation
    - Implement swipe-down to close gesture
    - Add backdrop with tap-to-close
    - Support 'half' and 'full' height modes
    - _Requirements: 5.4, 5.5, 10.3, 16.2_

  - [~] 3.4 Create TouchButton component
    - Create `src/components/ui/TouchButton.tsx` with 44x44px minimum size on mobile
    - Implement visual active state feedback
    - Support icon + label combinations
    - Add haptic-like animation on tap
    - _Requirements: 18.1, 18.3_

  - [~] 3.5 Create ResponsiveForm component
    - Create `src/components/ui/ResponsiveForm.tsx` with stacked mobile layout
    - Implement 44px minimum input height
    - Add labels above inputs for mobile
    - Support sticky action buttons at bottom on mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [-] 4. Implement responsive dashboard module
  - [~] 4.1 Adapt dashboard statistics cards for mobile
    - Modify `src/app/(dashboard)/dashboard/page.tsx` to stack cards vertically on mobile
    - Use full width minus 16px padding for mobile cards
    - Implement responsive font sizes (text-xl mobile, text-2xl desktop)
    - _Requirements: 2.3, 2.4, 2.6_

  - [~] 4.2 Make dashboard charts responsive
    - Scale charts proportionally to fit mobile viewport width
    - Ensure chart legends and labels remain readable on mobile
    - Test with all chart types (bar, line, pie)
    - _Requirements: 2.5_

  - [~] 4.3 Optimize dashboard layout shell
    - Remove rounded corners and margins in mobile viewport
    - Use full screen width for mobile
    - Ensure action buttons wrap properly on mobile
    - _Requirements: 2.1, 2.2, 2.7_

- [-] 5. Implement responsive products module
  - [~] 5.1 Convert products table to card layout
    - Modify `src/app/(dashboard)/dashboard/products/page.tsx` to use ResponsiveTable
    - Design product cards showing image, name, price, stock, and status
    - Implement tap-to-expand for full product details
    - Add action menu icon on each card for edit/delete
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [~] 5.2 Optimize product search and filters for mobile
    - Make search bar prominent at top with full width on mobile
    - Convert category filters to horizontally scrollable chips
    - Implement filter button that opens BottomSheet with all filters
    - Add active filter count badge on filter icon
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [~] 5.3 Adapt product forms for mobile
    - Convert product create/edit modal to full-screen on mobile
    - Stack form fields vertically with 44px input height
    - Support mobile camera capture for product images
    - Implement sticky save/cancel buttons at bottom
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.3_

  - [~] 5.4 Optimize product grid layout
    - Use 2-column grid on mobile (instead of 4 on desktop)
    - Ensure product cards are touch-friendly with adequate spacing
    - Implement lazy loading for product images
    - _Requirements: 5.6, 15.3, 18.2_

- [x] 6. Implement responsive inventory module
  - [~] 6.1 Convert inventory table to card layout
    - Modify `src/app/(dashboard)/dashboard/inventory/page.tsx` to use ResponsiveTable
    - Design inventory cards showing product image, name, stock, and branch
    - Add visual indicators for low stock and out-of-stock on cards
    - _Requirements: 6.1, 6.2, 6.7_

  - [~] 6.2 Optimize stock adjustment controls for mobile
    - Implement large +/- buttons (44x44px) for quantity adjustment
    - Make stock adjustment modal full-screen on mobile
    - Use native mobile select for branch selector
    - _Requirements: 6.3, 6.5, 6.6_

  - [~] 6.3 Adapt transfer request forms for mobile
    - Convert transfer modal to full-screen on mobile
    - Stack form fields vertically with touch-friendly inputs
    - Implement product search with mobile-optimized results
    - _Requirements: 6.4, 4.1, 4.2_

- [~] 7. Implement mobile POS module
  - [~] 7.1 Create mobile POS layout structure
    - Modify `src/app/(dashboard)/dashboard/pos/page.tsx` to use stacked layout on mobile
    - Display product catalog first with full width
    - Hide cart sidebar on mobile (will use bottom sheet instead)
    - _Requirements: 5.1, 5.2_

  - [~] 7.2 Create FloatingCartButton component
    - Create `src/components/pos/FloatingCartButton.tsx` fixed at bottom-right
    - Display item count badge and total amount
    - Show only when cart has items
    - Implement 44x44px minimum touch target
    - _Requirements: 5.3, 18.1_

  - [~] 7.3 Implement POS cart as BottomSheet
    - Use BottomSheet component for mobile cart
    - Display cart items, subtotal, tax, and total
    - Add payment button at bottom
    - Support swipe-down to close
    - _Requirements: 5.4, 5.5, 16.2_

  - [~] 7.4 Optimize POS product grid for mobile
    - Use 2-column grid for products on mobile
    - Ensure product cards show image, name, price, and stock clearly
    - Make product cards touch-friendly with adequate spacing
    - _Requirements: 5.6, 5.7, 18.2_

  - [~] 7.5 Adapt POS category filters for mobile
    - Convert category filters to horizontally scrollable chips
    - Implement swipe gesture for horizontal scrolling
    - Highlight active category clearly
    - _Requirements: 5.8, 16.1_

  - [~] 7.6 Optimize POS search for mobile
    - Make search bar prominent and full-width at top
    - Implement mobile-friendly search results
    - Add clear button in search input
    - _Requirements: 5.9_

  - [~] 7.7 Adapt POS payment modal for mobile
    - Convert payment modal to full-screen on mobile
    - Stack payment method options vertically
    - Use large touch-friendly buttons for payment methods
    - Implement numeric keypad-friendly amount input
    - _Requirements: 5.10, 18.1_

  - [~] 7.8 Support landscape orientation for POS
    - Optimize POS layout for landscape mode with side-by-side product/cart
    - Ensure smooth transition when orientation changes
    - _Requirements: 17.3, 17.2_

- [~] 8. Implement responsive purchases module
  - [~] 8.1 Convert purchases table to card layout
    - Modify `src/app/(dashboard)/dashboard/purchases/page.tsx` to use ResponsiveTable
    - Design purchase cards showing supplier, date, total, and status
    - Add action menu on each card for view/cancel/receive
    - _Requirements: 3.1, 3.2, 3.6_

  - [~] 8.2 Adapt purchase forms for mobile
    - Convert purchase create/edit modal to full-screen on mobile
    - Stack form fields vertically with 44px inputs
    - Use native mobile select for supplier selection
    - Implement touch-friendly product selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [~] 9. Implement responsive users module
  - [~] 9.1 Convert users table to card layout
    - Modify `src/app/(dashboard)/dashboard/users/page.tsx` to use ResponsiveTable
    - Design user cards showing avatar, name, role, and status
    - Add action menu on each card for edit/deactivate
    - _Requirements: 13.1, 13.2_

  - [~] 9.2 Adapt user forms for mobile
    - Convert user create/edit modal to full-screen on mobile
    - Stack form fields vertically with 44px inputs
    - Use native mobile select for role selection
    - Support mobile camera capture for user avatar
    - Implement large touch-friendly permission toggles (44px height)
    - _Requirements: 13.3, 13.4, 13.7, 9.3_

- [~] 10. Implement responsive branches module
  - [~] 10.1 Convert branches table to card layout
    - Modify `src/app/(dashboard)/dashboard/branches/page.tsx` to use ResponsiveTable
    - Design branch cards showing logo, name, address, and status
    - Add action menu on each card for edit/deactivate
    - _Requirements: 13.5_

  - [~] 10.2 Adapt branch forms for mobile
    - Convert branch create/edit modal to full-screen on mobile
    - Stack form fields vertically with 44px inputs
    - Support mobile camera capture for branch logo
    - _Requirements: 13.6, 9.3_

- [~] 11. Implement responsive cash sessions module
  - [~] 11.1 Convert cash sessions table to card layout
    - Modify `src/app/(dashboard)/dashboard/cash-sessions/page.tsx` to use ResponsiveTable
    - Design session cards showing user, branch, date, opening/closing amounts
    - Add visual indicators for open vs closed sessions
    - _Requirements: 3.1, 3.2_

  - [~] 11.2 Optimize cash session controls for mobile
    - Convert open cash modal to full-screen on mobile
    - Implement large numeric keypad-friendly amount input
    - Use native mobile select for branch selector (global users)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [~] 11.3 Adapt close cash modal for mobile
    - Display cash summary in card layout on mobile
    - Stack transaction breakdown vertically
    - Implement large touch-friendly confirm button
    - _Requirements: 12.5, 12.6_

- [~] 12. Implement responsive businesses module
  - [~] 12.1 Convert businesses table to card layout
    - Modify `src/app/(dashboard)/dashboard/businesses/page.tsx` to use ResponsiveTable
    - Design business cards showing name, owner, branches count, status
    - Add action menu on each card for edit/view branches
    - _Requirements: 3.1, 3.2_

  - [~] 12.2 Adapt business forms for mobile
    - Convert business create/edit modal to full-screen on mobile
    - Stack form fields vertically with 44px inputs
    - _Requirements: 4.1, 4.2, 4.3_

- [~] 13. Implement responsive audit module
  - [~] 13.1 Convert audit log table to card layout
    - Modify `src/app/(dashboard)/dashboard/audit/page.tsx` to use ResponsiveTable
    - Design audit cards showing timestamp, user, action, and entity
    - Support tap-to-expand for full audit details
    - _Requirements: 14.1, 14.2, 14.6_

  - [~] 13.2 Optimize audit filters for mobile
    - Use native mobile date pickers for date range filters
    - Convert filter options to BottomSheet on mobile
    - Make export buttons clearly visible and accessible
    - _Requirements: 14.3, 14.4_

  - [~] 13.3 Make audit reports responsive
    - Scale report charts to fit mobile viewport width
    - Stack report sections vertically on mobile
    - _Requirements: 14.5_

- [~] 14. Implement mobile notifications system
  - [~] 14.1 Optimize notification panel for mobile
    - Ensure notification bell has 44x44px touch target in mobile header
    - Make notification panel slide down from top on mobile
    - Use full width for notification panel on mobile
    - _Requirements: 11.1, 11.2, 11.3_

  - [~] 14.2 Enhance notification cards for mobile
    - Make notification cards easily tappable with clear separation
    - Ensure unread badge is clearly visible on bell icon
    - Implement tap-to-navigate and auto-close panel
    - _Requirements: 11.4, 11.5, 11.6_

- [~] 15. Implement responsive images and media
  - [~] 15.1 Optimize product images for mobile
    - Scale product images proportionally to fit mobile viewport
    - Implement lazy loading for images below the fold
    - Add skeleton loaders while images load
    - _Requirements: 9.1, 15.2, 15.3_

  - [~] 15.2 Create mobile image gallery component
    - Implement horizontal swipe navigation for image galleries
    - Add touch-friendly navigation dots
    - Support pinch-to-zoom gesture
    - _Requirements: 9.2, 9.5, 16.3_

  - [~] 15.3 Optimize image uploads for mobile
    - Support mobile camera capture in image upload component
    - Compress and optimize uploaded images for mobile bandwidth
    - Show upload progress clearly
    - _Requirements: 9.3, 9.4_

  - [~] 15.4 Make logo images responsive
    - Scale logo images appropriately in mobile header
    - Ensure logos remain clear and recognizable on small screens
    - _Requirements: 9.6_

- [~] 16. Implement touch gestures and interactions
  - [~] 16.1 Add swipe gestures for horizontal scrolling
    - Implement swipe support for category chips
    - Add swipe support for image galleries
    - Ensure smooth swipe animations
    - _Requirements: 16.1, 16.2_

  - [~] 16.2 Implement pull-to-refresh
    - Add pull-to-refresh gesture on list views (products, inventory, purchases)
    - Show loading indicator during refresh
    - Reload data from server on pull-to-refresh
    - _Requirements: 16.4_

  - [~] 16.3 Add long-press contextual actions
    - Implement long-press on list items to show quick actions
    - Display contextual menu with edit/delete options
    - _Requirements: 16.5_

  - [~] 16.4 Implement swipe-to-reveal actions
    - Add swipe gesture on cards to reveal edit/delete actions
    - Implement smooth swipe animation
    - _Requirements: 16.6_

- [~] 17. Implement performance optimizations
  - [~] 17.1 Add loading states and skeleton loaders
    - Create skeleton loader components for cards, tables, and forms
    - Show skeleton loaders while data is fetching
    - Ensure smooth transition from skeleton to actual content
    - _Requirements: 15.2_

  - [~] 17.2 Implement data caching strategy
    - Cache frequently accessed data (products, categories) using SWR
    - Set appropriate cache expiration times
    - Implement cache invalidation on data mutations
    - _Requirements: 15.4, 19.1_

  - [~] 17.3 Optimize initial page load
    - Implement code splitting for route-based lazy loading
    - Prioritize loading critical UI elements first
    - Measure and optimize to achieve < 3s load on 3G
    - _Requirements: 15.1, 15.6_

  - [~] 17.4 Add network status indicators
    - Show clear indicator when in offline mode
    - Display loading indicators during slow network
    - Notify user when connection is restored
    - _Requirements: 15.5, 19.2, 19.4_

- [~] 18. Implement basic offline support
  - [~] 18.1 Cache product catalog for offline viewing
    - Store product data in IndexedDB for offline access
    - Include product images, prices, and stock info in cache
    - Display cached data when network is unavailable
    - _Requirements: 19.1, 19.5_

  - [~] 18.2 Implement action queuing for offline mode
    - Queue user actions (sales, stock adjustments) when offline
    - Sync queued actions when connection is restored
    - Show pending actions indicator to user
    - _Requirements: 19.3_

- [~] 19. Implement orientation support
  - [~] 19.1 Add orientation change handling
    - Detect orientation changes and update layout accordingly
    - Ensure smooth transition without data loss
    - Test all modules in both portrait and landscape
    - _Requirements: 17.1, 17.2_

  - [~] 19.2 Optimize forms for landscape orientation
    - Use 2-column layout for forms in landscape mode
    - Ensure forms remain usable and keyboard doesn't obscure inputs
    - _Requirements: 17.4_

- [~] 20. Implement accessibility and touch targets
  - [~] 20.1 Audit and fix touch target sizes
    - Ensure all interactive elements meet 44x44px minimum
    - Add adequate spacing (8px minimum) between tappable elements
    - Test with accessibility tools
    - _Requirements: 18.1, 18.2_

  - [~] 20.2 Add visual feedback for interactions
    - Implement active states for all buttons and tappable elements
    - Add haptic-like animations on tap
    - Ensure form inputs have adequate padding
    - _Requirements: 18.3, 18.4_

  - [~] 20.3 Add confirmation for critical actions
    - Require confirmation tap for delete actions
    - Require confirmation for close cash session
    - Implement confirmation modal with clear yes/no buttons
    - _Requirements: 18.5_

- [~] 21. Testing and quality assurance
  - [~] 21.1 Test navigation across all modules on mobile
    - Test mobile menu open/close functionality
    - Verify all navigation items work correctly
    - Test role-based menu filtering
    - _Requirements: 1.1-1.9_

  - [~] 21.2 Test responsive layouts on various screen sizes
    - Test on small phones (320px width)
    - Test on standard phones (375px, 414px width)
    - Test on tablets (768px width)
    - Test on desktop (1024px+ width)
    - _Requirements: 2.1-2.7, 20.1-20.7_

  - [~] 21.3 Test all table-to-card transformations
    - Verify products, inventory, purchases, users, branches, businesses, cash sessions, and audit tables transform correctly
    - Test tap-to-expand functionality
    - Test action menus on cards
    - _Requirements: 3.1-3.8_

  - [~] 21.4 Test all forms on mobile
    - Test product, purchase, user, branch, business, and cash session forms
    - Verify keyboard doesn't obscure inputs
    - Test form validation and submission
    - _Requirements: 4.1-4.8_

  - [~] 21.5 Test mobile POS functionality end-to-end
    - Test product browsing and search
    - Test adding items to cart via bottom sheet
    - Test payment flow
    - Test landscape orientation
    - _Requirements: 5.1-5.10_

  - [~] 21.6 Test touch gestures across modules
    - Test swipe gestures for horizontal scrolling
    - Test pull-to-refresh on list views
    - Test long-press contextual actions
    - Test swipe-to-reveal actions on cards
    - Test pinch-to-zoom on images
    - _Requirements: 16.1-16.6_

  - [~] 21.7 Test performance on slow networks
    - Test initial load time on 3G connection
    - Verify skeleton loaders appear correctly
    - Test lazy loading of images
    - _Requirements: 15.1-15.6_

  - [~] 21.8 Test offline functionality
    - Test viewing cached product catalog offline
    - Test action queuing when offline
    - Test sync when connection restored
    - _Requirements: 19.1-19.5_

- [~] 22. Final checkpoint - Comprehensive mobile testing
  - Test the complete application on real mobile devices (iOS and Android)
  - Verify all modules work correctly on mobile
  - Ensure desktop design remains unchanged
  - Confirm all touch targets meet 44x44px minimum
  - Validate performance meets < 3s load time on 3G
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses mobile-first approach with Tailwind CSS breakpoints (md: 768px)
- Desktop design remains completely unchanged (>= 768px viewport)
- All interactive elements must meet 44x44px minimum touch target size
- Performance target: < 3 seconds initial load on 3G connection
- Tech stack: Next.js, TypeScript, Tailwind CSS, SWR, React Hook Form
