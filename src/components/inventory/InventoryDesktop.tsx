'use client';

import { 
  ContractsIcon, Search01Icon, ArrowLeft01Icon, ArrowRight01Icon, Download01Icon, 
  CircleArrowUp02Icon, ArrowDataTransferHorizontalIcon, PackageIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StockMovementModal } from '@/components/dashboard/StockMovementModal';
import { TransferModal } from '@/components/dashboard/TransferModal';
import { KardexTableRow } from './KardexTableRow';
import { TransferTableRow } from './TransferTableRow';
import { FilterDropdown } from '@/components/dashboard/products/FilterDropdown';

export function InventoryDesktop({ logic }: { logic: any }) {
  const {
    canManage,
    branches,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    branchFilter,
    setBranchFilter,
    kardexPage,
    setKardexPage,
    transfersPage,
    setTransfersPage,
    isMovementModalOpen,
    setIsMovementModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    showExportMenu,
    setShowExportMenu,
    transferStatusFilter,
    setTransferStatusFilter,
    processingTransferId,
    filteredMovements,
    filteredTransfers,
    paginatedMovements,
    paginatedTransfers,
    kardexTotalPages,
    transfersTotalPages,
    handleTransferAction,
    handleRefresh,
    exportToExcel,
    exportToPDF,
    isLoading,
    transfers,
  } = logic;

  const movementTypeConfig = {
    INPUT: 'Entrada',
    OUTPUT: 'Salida',
    ADJUSTMENT: 'Ajuste',
    SALE_POS: 'Venta POS',
    SALE_ECOMMERCE: 'Venta Online',
    PURCHASE: 'Compra',
    TRANSFER: 'Traslado',
  };

  const movementTypeOptions = Object.entries(movementTypeConfig).map(([key, label]) => ({
    id: key,
    name: label,
  }));

  const branchOptions = branches?.map((branch: any) => ({
    id: branch.name,
    name: branch.name,
  })) || [];

  const transferStatusOptions = [
    { id: 'PENDING', name: 'Pendiente' },
    { id: 'APPROVED', name: 'Aprobado' },
    { id: 'REJECTED', name: 'Rechazado' },
  ];

  return (
    <>
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Inventario</h1>
          <ContractsIcon className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <div className="w-full">
              <Input
                placeholder="Buscar producto, motivo o usuario..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setKardexPage(1);
                }}
                className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm"
              />
            </div>
          </div>
          {canManage && (
            <>
              <Button
                onClick={() => setIsMovementModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <CircleArrowUp02Icon className="w-3.5 h-3.5 mr-1.5" />
                <span className="font-bold">Movimiento</span>
              </Button>
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <ArrowDataTransferHorizontalIcon className="w-3.5 h-3.5 mr-1.5" />
                <span className="font-bold">Traslado</span>
              </Button>
              <div className="relative">
                <Button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  variant="ghost"
                  className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
                >
                  <Download01Icon className="w-3.5 h-3.5 mr-1.5" />
                  <span className="font-bold">Exportar</span>
                </Button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={exportToExcel}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <Download01Icon className="w-3.5 h-3.5" />
                        Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                      >
                        <Download01Icon className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        {/* Tabs + Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 w-full shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button
              onClick={() => setActiveTab('kardex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'kardex' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PackageIcon className="w-3.5 h-3.5" />
              Kardex ({filteredMovements.length})
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === 'transfers' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowDataTransferHorizontalIcon className="w-3.5 h-3.5" />
              Traslados ({filteredTransfers.length})
              {transfers?.filter((t: any) => t.status === 'PENDING').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                  {transfers.filter((t: any) => t.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>

          {/* Pagination */}
          {((activeTab === 'kardex' && kardexTotalPages > 1) || (activeTab === 'transfers' && transfersTotalPages > 1)) && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {activeTab === 'kardex' ? kardexPage : transfersPage} de {activeTab === 'kardex' ? kardexTotalPages : transfersTotalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm"
                  onClick={() => activeTab === 'kardex' ? setKardexPage((p: number) => Math.max(1, p - 1)) : setTransfersPage((p: number) => Math.max(1, p - 1))}
                  disabled={activeTab === 'kardex' ? kardexPage === 1 : transfersPage === 1}
                >
                  <ArrowLeft01Icon className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm"
                  onClick={() => activeTab === 'kardex' ? setKardexPage((p: number) => Math.min(kardexTotalPages, p + 1)) : setTransfersPage((p: number) => Math.min(transfersTotalPages, p + 1))}
                  disabled={activeTab === 'kardex' ? kardexPage === kardexTotalPages : transfersPage === transfersTotalPages}
                >
                  <ArrowRight01Icon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          {activeTab === 'kardex' ? (
            <table className="w-full text-left border-separate border-spacing-0 min-w-[900px] products-table">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
                <tr>
                  <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Fecha</th>
                  <th className="px-5 py-3.5 font-semibold relative select-none">
                    <FilterDropdown
                      label="Tipo"
                      currentValue={typeFilter}
                      options={movementTypeOptions}
                      onSelect={(value) => {
                        setTypeFilter(value as any);
                        setKardexPage(1);
                      }}
                      allLabel="Todos los tipos"
                      width="w-[180px]"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Producto</th>
                  <th className="px-5 py-3.5 font-semibold">Motivo</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Cantidad</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Había</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Hay</th>
                  <th className="px-5 py-3.5 font-semibold relative select-none">
                    <FilterDropdown
                      label="Sucursal"
                      currentValue={branchFilter}
                      options={branchOptions}
                      onSelect={(value) => {
                        setBranchFilter(value);
                        setKardexPage(1);
                      }}
                      allLabel="Todas las sucursales"
                      width="w-[200px]"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-semibold rounded-tr-xl">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="p-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </td>
                    </tr>
                  ))
                ) : paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <PackageIcon className="w-10 h-10 text-slate-200" strokeWidth={1} />
                        <p className="font-medium text-sm text-slate-500">No se encontraron movimientos.</p>
                        <Button
                          variant="link"
                          className="text-xs h-6 text-slate-900 font-bold"
                          onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('ALL');
                            setBranchFilter('ALL');
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((movement: any) => (
                    <KardexTableRow key={movement.id} movement={movement} />
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0 min-w-[900px] products-table">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
                <tr>
                  <th className="px-5 py-3.5 font-semibold rounded-tl-xl relative select-none">
                    <FilterDropdown
                      label="Estado"
                      currentValue={transferStatusFilter}
                      options={transferStatusOptions}
                      onSelect={(value) => {
                        setTransferStatusFilter(value as any);
                        setTransfersPage(1);
                      }}
                      allLabel="Todos los estados"
                      width="w-[180px]"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Origen → Destino</th>
                  <th className="px-5 py-3.5 font-semibold">Productos</th>
                  <th className="px-5 py-3.5 font-semibold">Solicitante</th>
                  <th className="px-5 py-3.5 font-semibold">Fecha</th>
                  <th className="px-5 py-3.5 font-semibold rounded-tr-xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </td>
                    </tr>
                  ))
                ) : paginatedTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <ArrowDataTransferHorizontalIcon className="w-10 h-10 text-slate-200" strokeWidth={1} />
                        <p className="font-medium text-sm text-slate-500">No se encontraron traslados.</p>
                        <Button
                          variant="link"
                          className="text-xs h-6 text-slate-900 font-bold"
                          onClick={() => {
                            setSearchTerm('');
                            setTransferStatusFilter('ALL');
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransfers.map((transfer: any) => (
                    <TransferTableRow
                      key={transfer.id}
                      transfer={transfer}
                      canManage={canManage}
                      processingTransferId={processingTransferId}
                      onAction={handleTransferAction}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {isMovementModalOpen && (
        <StockMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          onSuccess={handleRefresh}
          branches={branches || []}
        />
      )}

      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={handleRefresh}
          branches={branches || []}
        />
      )}
    </>
  );
}
