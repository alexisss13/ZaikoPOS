'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load desktop component
const AccountingDesktop = dynamic(
  () => import('@/components/accounting/AccountingDesktop').then(m => ({ default: m.default })),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex flex-col h-full w-full gap-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }
);

// Lazy-load mobile component
const AccountingMobile = dynamic(
  () => import('@/components/accounting/AccountingMobile').then(m => ({ default: m.default })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full w-full gap-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }
);

export default function AccountingPage() {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const router = useRouter();

  // Role-based access control
  useEffect(() => {
    if (user) {
      const allowedRoles = ['SUPER_ADMIN', 'OWNER', 'MANAGER'];
      if (!allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  // Loading state
  if (!user) {
    return (
      <div className="flex flex-col h-full w-full gap-5">
        <div className="flex items-center gap-2">
          <Skeleton className={isMobile ? "h-6 w-32" : "h-8 w-48"} />
        </div>
        <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4"}>
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className={isMobile ? "h-24 rounded-2xl" : "h-32 rounded-2xl"} />
          ))}
        </div>
      </div>
    );
  }

  // Access denied
  if (!['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500">No tienes permisos para acceder a contabilidad.</p>
        </div>
      </div>
    );
  }

  // Render appropriate component based on device
  return isMobile ? <AccountingMobile /> : <AccountingDesktop />;
}
