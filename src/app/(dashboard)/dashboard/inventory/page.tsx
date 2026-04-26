'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { useInventoryLogic } from '@/components/inventory/useInventoryLogic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load desktop — no se descarga en móvil
const InventoryDesktop = dynamic(
  () => import('@/components/inventory/InventoryDesktop').then(m => ({ default: m.InventoryDesktop })),
  { ssr: false, loading: () => <InventoryLoadingSkeleton /> }
);

// Componentes móviles
import { MobileInventoryHeader } from '@/components/inventory/mobile/MobileInventoryHeader';
import { MobileInventoryTabs } from '@/components/inventory/mobile/MobileInventoryTabs';
import { MobileKardexList } from '@/components/inventory/mobile/MobileKardexList';
import { MobileTransfersList } from '@/components/inventory/mobile/MobileTransfersList';

function InventoryLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full w-full gap-5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { isMobile } = useResponsive();
  const logic = useInventoryLogic();

  const {
    activeTab, setActiveTab,
    isLoading, movements, transfers,
    filteredMovements, filteredTransfers,
    paginatedMovements, paginatedTransfers,
    canManage, handleRefresh,
  } = logic;

  // Mobile loading state
  if (isMobile && isLoading) {
    return <InventoryLoadingSkeleton />;
  }

  // ── DESKTOP ──
  if (!isMobile) {
    return (
      <div className="flex flex-col h-full w-full gap-5">
        <InventoryDesktop logic={logic} />
      </div>
    );
  }

  // ── MOBILE ──
  return (
    <div className="flex flex-col h-full w-full gap-3">
      <MobileInventoryHeader 
        logic={logic}
        canManage={canManage}
        onRefresh={handleRefresh}
      />

      <MobileInventoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={transfers?.filter(t => t.status === 'PENDING').length || 0}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'kardex' ? (
          <MobileKardexList
            movements={paginatedMovements}
            isLoading={isLoading}
            logic={logic}
          />
        ) : (
          <MobileTransfersList
            transfers={paginatedTransfers}
            isLoading={isLoading}
            logic={logic}
          />
        )}
      </div>
    </div>
  );
}
