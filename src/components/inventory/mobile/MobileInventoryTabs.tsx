import { PackageIcon, ArrowDataTransferHorizontalIcon } from 'hugeicons-react';

interface MobileInventoryTabsProps {
  activeTab: 'kardex' | 'transfers';
  onTabChange: (tab: 'kardex' | 'transfers') => void;
  pendingCount: number;
}

export function MobileInventoryTabs({ activeTab, onTabChange, pendingCount }: MobileInventoryTabsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onTabChange('kardex')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          activeTab === 'kardex'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200'
        }`}
      >
        <PackageIcon className="w-4 h-4" />
        Movimientos
      </button>
      <button
        onClick={() => onTabChange('transfers')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          activeTab === 'transfers'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200'
        }`}
      >
        <ArrowDataTransferHorizontalIcon className="w-4 h-4" />
        Traslados
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
