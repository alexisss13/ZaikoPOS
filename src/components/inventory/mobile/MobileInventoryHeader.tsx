import { PlusSignIcon, PackageMovingIcon,ArrowDataTransferHorizontalIcon, MoreHorizontalIcon, Download01Icon, ContractsIcon } from 'hugeicons-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Lazy load modales nativos
const NewMovementMobile = dynamic(() => import('../NewMovementMobile').then(m => ({ default: m.NewMovementMobile })), { ssr: false });
const NewTransferMobile = dynamic(() => import('../NewTransferMobile').then(m => ({ default: m.NewTransferMobile })), { ssr: false });

interface MobileInventoryHeaderProps {
  logic: any;
  canManage: boolean;
  onRefresh: () => void;
}

export function MobileInventoryHeader({ logic, canManage, onRefresh }: MobileInventoryHeaderProps) {
  const {
    filteredMovements,
    transfers,
    showExportMenu,
    setShowExportMenu,
    exportToExcel,
    exportToPDF,
    branches,
    products,
  } = logic;

  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Header con formato consistente */}
      <div className="bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-slate-100 rounded-xl">
              <ContractsIcon className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Inventario</h1>
              <p className="text-xs text-slate-500 font-semibold">
                {filteredMovements.length} movimiento{filteredMovements.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {canManage && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <PlusSignIcon className="w-3.5 h-3.5" strokeWidth={2} />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowNewMovement(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <PackageMovingIcon className="w-4 h-4 text-slate-400" />
                        Movimiento
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowNewTransfer(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ArrowDataTransferHorizontalIcon className="w-4 h-4 text-slate-400" />
                        Traslado
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((v: boolean) => !v)}
                  className="h-10 w-10 p-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <MoreHorizontalIcon className="w-4 h-4" strokeWidth={2} />
                </button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          exportToExcel();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Download01Icon className="w-4 h-4 text-slate-400" />
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          exportToPDF();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Download01Icon className="w-4 h-4 text-slate-400" />
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales nativos */}
      {showNewMovement && (
        <NewMovementMobile
          onClose={() => setShowNewMovement(false)}
          onSuccess={() => {
            setShowNewMovement(false);
            onRefresh();
          }}
          branches={branches || []}
          products={products || []}
        />
      )}

      {showNewTransfer && (
        <NewTransferMobile
          onClose={() => setShowNewTransfer(false)}
          onSuccess={() => {
            setShowNewTransfer(false);
            onRefresh();
          }}
          branches={branches || []}
          products={products || []}
        />
      )}
    </>
  );
}
