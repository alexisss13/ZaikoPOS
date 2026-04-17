import { render } from '@testing-library/react';
import { MobileHeader } from './MobileHeader';

describe('MobileHeader Snapshots', () => {
  it('should match snapshot with default props', () => {
    const { container } = render(
      <MobileHeader onMenuToggle={() => {}} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with notifications', () => {
    const { container } = render(
      <MobileHeader 
        onMenuToggle={() => {}}
        notificationCount={5}
        onNotificationClick={() => {}}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom branding', () => {
    const { container } = render(
      <MobileHeader 
        onMenuToggle={() => {}}
        brandLogo="https://example.com/logo.png"
        brandName="Custom Brand"
        notificationCount={3}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with zero notifications', () => {
    const { container } = render(
      <MobileHeader 
        onMenuToggle={() => {}}
        notificationCount={0}
        onNotificationClick={() => {}}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
