'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div 
      className={`h-full w-full transition-opacity duration-100 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      style={{ willChange: 'opacity' }}
    >
      {children}
    </div>
  );
}
