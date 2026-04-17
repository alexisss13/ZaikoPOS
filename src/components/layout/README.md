# Layout Components

This directory contains layout-related components for the ZaikoPOS application.

## Components

### MobileHeader

Mobile-only header component that provides navigation and notifications for mobile devices (< 768px).

**Features:**
- Brand logo/name display
- Notification bell with unread count badge
- Hamburger menu button for mobile navigation
- 44x44px minimum touch targets for all interactive elements
- Responsive visibility (hidden on desktop >= 768px)

**Usage:**

```tsx
import { MobileHeader } from '@/components/layout';

function MyLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div>
      <MobileHeader 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        notificationCount={5}
        onNotificationClick={() => console.log('Notifications')}
        brandName="My App"
      />
      {/* Rest of layout */}
    </div>
  );
}
```

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onMenuToggle` | `() => void` | Yes | - | Callback when hamburger menu is clicked |
| `notificationCount` | `number` | No | `0` | Number of unread notifications |
| `onNotificationClick` | `() => void` | No | - | Callback when notification bell is clicked |
| `brandLogo` | `string` | No | - | URL of brand logo image |
| `brandName` | `string` | No | `'F&F ADMIN'` | Brand name to display |

**Requirements Satisfied:**
- ✅ Requirement 1.1: Mobile Navigation - Hamburger menu accessible
- ✅ Requirement 1.9: Touch Target Size - 44x44px minimum for all interactive elements
- ✅ Requirement 18.1: Accessibility - All touch targets meet minimum size requirements

**Testing:**

Run tests with:
```bash
npm test -- src/components/layout/MobileHeader.test.tsx --no-watch
```

**Examples:**

See `MobileHeader.example.tsx` for detailed usage examples including:
- Basic usage
- With notifications
- Custom branding
- Integration with layout
- Dynamic branding based on user role
