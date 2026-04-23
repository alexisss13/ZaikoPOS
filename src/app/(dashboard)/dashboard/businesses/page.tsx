'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  PlusSignIcon, MoreVerticalIcon, 
  CheckmarkCircle02Icon, CancelCircleIcon, UserMultiple02Icon, Store01Icon, UnavailableIcon, Delete02Icon, Mail01Icon,
  Search01Icon, ArrowLeft01Icon, ArrowRight01Icon, LayoutGridIcon, Building02Icon, Edit02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BusinessModal, BusinessData } from '@/components/dashboard/BusinessModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Business {
  id: string;
  name: string;
  ruc: string;
  address: string | null;
  isActive: boolean;
  maxBranches: number;
  maxManagers: number;
  maxEmployees: number;
  _count: {
    branches: number;
    users: number;
  };
  users: Array<{ name: string; email: string }>;
}

const ITEMS_PER_PAGE = 9;

export default function BusinessesPage() {
  const { data: businesses, isLoading, mutate } = useSWR<Business[]>('/api/businesses', fetcher);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    
    return businesses.filter(biz => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        biz.name.toLowerCase().includes(searchLower) || 
        (biz.users[0]?.email.toLowerCase().includes(searchLower) ?? false);

      let matchesStatus = true;
      if (filterStatus === 'ACTIVE') matchesStatus = biz.isActive === true;
      if (filterStatus === 'SUSPENDED') matchesStatus = biz.isActive === false;
      if (filterStatus === 'PENDING') matchesStatus = biz.ruc.startsWith('PENDING');

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE) || 1;
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleOpenNew = () => { setSelectedBusiness(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (biz: Business, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedBusiness({ 
      id: biz.id, 
      name: biz.name, 
      ruc: biz.ruc,
      address: biz.address || undefined,
      maxBranches: biz.maxBranches, 
      maxManagers: biz.maxManagers || 1, 
      maxEmployees: biz.maxEmployees 
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleToggleStatus = async (biz: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/businesses/${biz.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !biz.isActive }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      toast.success(`El servicio ha sido ${!biz.isActive ? 'Activado' : 'Suspendido'}`);
      mutate();
    } catch (error) { toast.error('No se pudo completar'); } 
    finally { setOpenDropdownId(null); }
  };

  const handleDelete = async (bizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('🛑 ¿ESTÁS SEGURO? Esta acción borrará TODO: Ventas, Usuarios, Productos. NO se puede deshacer.')) return setOpenDropdownId(null);
    toast.loading('Eliminando ecosistema en cascada...');
    try {
      const res = await fetch(`/api/businesses/${bizId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Negocio eliminado definitivamente.');
      mutate();
    } catch (error) { toast.error('Error al eliminar.'); } 
    finally { setOpenDropdownId(null); }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* 🚀 TOOLBAR SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Clientes SaaS</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={2} />
            </div>
            <Input 
              placeholder="Buscar por negocio o correo..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm"
            />
          </div>

          <Button onClick={handleOpenNew} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0">
            <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> <span className="font-bold">Registrar Dueño</span>
          </Button>
        </div>
      </div>

      {/* 🚀 CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* 🚀 SUBHEADER: TABS Y PAGINACIÓN INTEGRADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            {(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING'] as const).map((status) => (
              <button 
                key={status} 
                onClick={() => {setFilterStatus(status); setCurrentPage(1)}}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' && <><LayoutGridIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Todos</>}
                {status === 'ACTIVE' && <><CheckmarkCircle02Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> Activos</>}
                {status === 'SUSPENDED' && <><CancelCircleIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Suspendidos</>}
                {status === 'PENDING' && <><Building02Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> Pendientes RUC</>}
              </button>
            ))}
          </div>

          {/* Paginación a la derecha */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ArrowLeft01Icon className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ArrowRight01Icon className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* 🚀 GRID DE TARJETAS COMPACTAS */}
        <div className="flex-1 p-4 bg-slate-50/50 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl bg-white border border-slate-200 shadow-sm" />)}
            </div>
          ) : paginatedBusinesses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-20 mt-4">
              <Store01Icon className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1.5} />
              <p className="font-medium text-sm text-slate-500">No se encontraron negocios.</p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }} className="text-blue-600 font-bold">Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBusinesses.map((biz: Business) => {
                const isPending = biz.ruc.startsWith('PENDING');
                const owner = biz.users[0];
                const isDropdownOpen = openDropdownId === biz.id;

                return (
                  <div 
                    key={biz.id} 
                    onClick={() => handleOpenEdit(biz)}
                    className={`group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col overflow-hidden animate-in fade-in zoom-in-95 ${
                      !biz.isActive ? 'opacity-70 grayscale-[20%]' : ''
                    } ${isDropdownOpen ? 'z-50' : 'z-10'}`}
                  >
                    
                    <div className="p-4 flex flex-col flex-1">
                      
                      {/* HEADER CARD */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm ${
                            biz.isActive ? 'bg-slate-900' : 'bg-slate-400'
                          }`}>
                            {biz.name.charAt(0)}
                          </div>
                          
                          <div className="min-w-0 pr-6">
                            <h3 className="font-bold text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">{biz.name}</h3>
                            
                            <div className="flex items-center gap-1.5 mt-1">
                              {biz.isActive ? (
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-300 gap-1 px-1.5 py-0 h-4 text-[9px] font-bold">
                                  <CheckmarkCircle02Icon className="w-2.5 h-2.5" strokeWidth={1.5} /> Activa
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1 px-1.5 py-0 h-4 text-[9px] font-bold bg-red-100 text-red-700 border-red-300">
                                  <CancelCircleIcon className="w-2.5 h-2.5" strokeWidth={1.5} /> Suspendida
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón flotante Opciones */}
                        <div className="absolute top-3 right-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : biz.id); }}>
                            <MoreVerticalIcon className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                          
                          {isDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                                <button onClick={(e) => handleOpenEdit(biz, e)} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors">
                                  <Edit02Icon className="w-4 h-4" strokeWidth={1.5} /> Editar Límites
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                <button onClick={(e) => handleToggleStatus(biz, e)} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors">
                                  <UnavailableIcon className={`w-4 h-4 ${biz.isActive ? "text-orange-500" : "text-emerald-500"}`} strokeWidth={1.5} />
                                  {biz.isActive ? 'Suspender' : 'Activar'}
                                </button>
                                {!biz.isActive && (
                                  <>
                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                    <button onClick={(e) => handleDelete(biz.id, e)} className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors">
                                      <Delete02Icon className="w-4 h-4" strokeWidth={1.5} /> Eliminar
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* DATA CARD */}
                      <div className="space-y-1.5 text-slate-500 flex-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Mail01Icon className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                          <span className="truncate leading-tight text-xs font-medium">
                            {owner ? owner.email : 'Sin dueño asignado'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building02Icon className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                          {isPending ? (
                            <span className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">Falta RUC</span>
                          ) : (
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">RUC: {biz.ruc}</span>
                          )}
                        </div>
                      </div>

                      {/* FOOTER CARD: Límites */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Sucursales</p>
                          <p className="font-bold text-slate-700 flex items-center justify-center gap-1 text-sm">
                            <Store01Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} /> {biz.maxBranches}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Jefes/Suc</p>
                          <p className="font-bold text-slate-700 flex items-center justify-center gap-1 text-sm">
                            <UserMultiple02Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} /> {biz.maxManagers || 1}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cajeros/Suc</p>
                          <p className="font-bold text-slate-700 flex items-center justify-center gap-1 text-sm">
                            <UserMultiple02Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} /> {biz.maxEmployees}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <BusinessModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} businessToEdit={selectedBusiness} />
    </div>
  );
}