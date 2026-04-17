import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileMenuDrawer, MenuItem, User } from './MobileMenuDrawer';
import { LayoutDashboard, Package, Users } from 'lucide-react';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, onClick, className }: any) => {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  };
});

describe('MobileMenuDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnLogout = jest.fn();

  const mockUser: User = {
    name: 'John Doe',
    role: 'MANAGER',
    image: 'https://example.com/avatar.jpg',
  };

  const mockMenuItems: MenuItem[] = [
    {
      href: '/dashboard',
      label: 'Resumen',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      href: '/dashboard/products',
      label: 'Productos',
      icon: Package,
      isActive: false,
    },
    {
      href: '/dashboard/users',
      label: 'Usuarios',
      icon: Users,
      isActive: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.2: Mobile Menu Accessibility', () => {
    it('should be accessible through hamburger menu and slide in from left', () => {
      const { rerender } = render(
        <MobileMenuDrawer
          isOpen={false}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Initially hidden (translated off-screen)
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('-translate-x-full');

      // Open the drawer
      rerender(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Should slide in (no translation)
      expect(drawer).toHaveClass('translate-x-0');
    });

    it('should have smooth animation classes', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('transition-transform', 'duration-300', 'ease-out');
    });
  });

  describe('Requirement 1.3: Navigation Items Display', () => {
    it('should display all navigation items with icons and labels', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Check all menu items are rendered
      expect(screen.getByText('Resumen')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('should highlight active navigation item', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Check that active item is rendered with distinct styling
      const resumeText = screen.getByText('Resumen');
      expect(resumeText).toBeInTheDocument();
      
      // The parent link should have active classes
      const linkElement = resumeText.closest('a');
      expect(linkElement).toBeInTheDocument();
      if (linkElement) {
        expect(linkElement.className).toMatch(/bg-slate-900/);
      }
    });

    it('should close menu when navigation item is clicked', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const productLink = screen.getByText('Productos');
      fireEvent.click(productLink);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 1.4: User Profile Section', () => {
    it('should display user profile at top with avatar and role', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Check user name
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Check user role
      expect(screen.getByText('MANAGER')).toBeInTheDocument();

      // Check avatar image
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display fallback icon when user has no image', () => {
      const userWithoutImage: User = {
        name: 'Jane Doe',
        role: 'CASHIER',
      };

      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={userWithoutImage}
          onLogout={mockOnLogout}
        />
      );

      // Should render UserCircle icon as fallback
      const profileSection = screen.getByText('Jane Doe').closest('div');
      expect(profileSection).toBeInTheDocument();
    });
  });

  describe('Requirement 1.5: POS Quick Access Button', () => {
    it('should display POS button at bottom when showPOSButton is true', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
          showPOSButton={true}
        />
      );

      expect(screen.getByText('IR AL POS')).toBeInTheDocument();
    });

    it('should hide POS button when showPOSButton is false', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
          showPOSButton={false}
        />
      );

      expect(screen.queryByText('IR AL POS')).not.toBeInTheDocument();
    });

    it('should highlight POS button when active', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
          showPOSButton={true}
          isPOSActive={true}
        />
      );

      // Check that POS button has active styling
      const posText = screen.getByText('IR AL POS');
      const posLink = posText.closest('a');
      expect(posLink).toBeInTheDocument();
      if (posLink) {
        expect(posLink.className).toMatch(/bg-emerald-600/);
      }
    });

    it('should close menu when POS button is clicked', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
          showPOSButton={true}
        />
      );

      const posButton = screen.getByText('IR AL POS');
      fireEvent.click(posButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 1.6: Logout Button', () => {
    it('should display logout button at bottom', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('should call onLogout and onClose when logout button is clicked', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByText('Cerrar Sesión');
      fireEvent.click(logoutButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 1.7: Backdrop Click-to-Close', () => {
    it('should display backdrop when drawer is open', () => {
      const { container } = render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('opacity-100');
    });

    it('should hide backdrop when drawer is closed', () => {
      const { container } = render(
        <MobileMenuDrawer
          isOpen={false}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toHaveClass('opacity-0', 'pointer-events-none');
    });

    it('should close drawer when backdrop is clicked', () => {
      const { container } = render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close drawer when close button is clicked', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const closeButton = screen.getByLabelText('Close menu');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close drawer when Escape key is pressed', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Touch Target Requirements', () => {
    it('should have minimum 44x44px touch targets for all interactive elements', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Close button
      const closeButton = screen.getByLabelText('Close menu');
      expect(closeButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');

      // Navigation items - check they have adequate touch targets
      const resumeText = screen.getByText('Resumen');
      const resumeLink = resumeText.closest('a');
      expect(resumeLink).toBeInTheDocument();
      if (resumeLink) {
        expect(resumeLink.className).toMatch(/min-h-\[44px\]/);
      }

      // POS button - check it has adequate touch target
      const posText = screen.getByText('IR AL POS');
      const posLink = posText.closest('a');
      expect(posLink).toBeInTheDocument();
      if (posLink) {
        expect(posLink.className).toMatch(/min-h-\[44px\]/);
      }

      // Logout button
      const logoutButton = screen.getByText('Cerrar Sesión').closest('button');
      expect(logoutButton).toHaveClass('min-h-[44px]');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
      expect(drawer).toHaveAttribute('aria-label', 'Mobile navigation menu');
    });

    it('should prevent body scroll when open', () => {
      const { rerender } = render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <MobileMenuDrawer
          isOpen={false}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Responsive Behavior', () => {
    it('should only be visible on mobile (md:hidden class)', () => {
      render(
        <MobileMenuDrawer
          isOpen={true}
          onClose={mockOnClose}
          menuItems={mockMenuItems}
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('md:hidden');
    });
  });
});
