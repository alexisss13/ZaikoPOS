import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHeader } from './MobileHeader';

describe('MobileHeader', () => {
  const mockOnMenuToggle = jest.fn();
  const mockOnNotificationClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1: Mobile Navigation - Hamburger Menu', () => {
    it('should render hamburger menu button with minimum 44x44px touch target', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const menuButton = screen.getByLabelText('Open menu');
      expect(menuButton).toBeInTheDocument();
      
      // Verify minimum touch target size
      const styles = window.getComputedStyle(menuButton);
      expect(menuButton.className).toContain('min-w-[44px]');
      expect(menuButton.className).toContain('min-h-[44px]');
    });

    it('should call onMenuToggle when hamburger menu is clicked', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 1.9: Touch Target Size', () => {
    it('should have notification bell with minimum 44x44px touch target', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          onNotificationClick={mockOnNotificationClick}
        />
      );

      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
      
      // Verify minimum touch target size
      expect(notificationButton.className).toContain('min-w-[44px]');
      expect(notificationButton.className).toContain('min-h-[44px]');
    });

    it('should call onNotificationClick when bell is clicked', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          onNotificationClick={mockOnNotificationClick}
        />
      );

      const notificationButton = screen.getByLabelText('Notifications');
      fireEvent.click(notificationButton);

      expect(mockOnNotificationClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 18.1: Accessibility - Touch Targets', () => {
    it('should have all interactive elements with minimum 44x44px touch targets', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          onNotificationClick={mockOnNotificationClick}
        />
      );

      const menuButton = screen.getByLabelText('Open menu');
      const notificationButton = screen.getByLabelText('Notifications');

      // Both buttons should have minimum touch target classes
      expect(menuButton.className).toContain('min-w-[44px]');
      expect(menuButton.className).toContain('min-h-[44px]');
      expect(notificationButton.className).toContain('min-w-[44px]');
      expect(notificationButton.className).toContain('min-h-[44px]');
    });
  });

  describe('Logo and Brand Display', () => {
    it('should display brand name when no logo is provided', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          brandName="Test Brand"
        />
      );

      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    it('should display custom brand logo when provided', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          brandLogo="https://example.com/logo.png"
          brandName="Test Brand"
        />
      );

      const logo = screen.getByAltText('Test Brand');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should use default brand name when not provided', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      expect(screen.getByText('F&F ADMIN')).toBeInTheDocument();
    });
  });

  describe('Notification Badge', () => {
    it('should display notification badge when count > 0', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          notificationCount={5}
        />
      );

      const badge = screen.getByLabelText('5 unread notifications');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-500');
    });

    it('should not display notification badge when count is 0', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          notificationCount={0}
        />
      );

      const badge = screen.queryByLabelText(/unread notifications/);
      expect(badge).not.toBeInTheDocument();
    });

    it('should not display notification badge when count is undefined', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const badge = screen.queryByLabelText(/unread notifications/);
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Responsive Visibility', () => {
    it('should have md:hidden class to hide on desktop viewports', () => {
      const { container } = render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('md:hidden');
    });

    it('should have proper mobile styling classes', () => {
      const { container } = render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('h-14');
      expect(header).toHaveClass('bg-white');
      expect(header).toHaveClass('shadow-sm');
      expect(header).toHaveClass('border-b');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
          onNotificationClick={mockOnNotificationClick}
        />
      );

      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });

    it('should have semantic header element', () => {
      const { container } = render(
        <MobileHeader 
          onMenuToggle={mockOnMenuToggle}
        />
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });
});
