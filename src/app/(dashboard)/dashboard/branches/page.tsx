// src/app/(dashboard)/dashboard/branches/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, Search, Store, Building, MapPin, Phone, ReceiptText, Trash2, Edit, ChevronLeft, ChevronRight, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BranchModal, BranchData } from '@/components/dashboard/BranchModal';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  customRuc: string | null;
  customLegalName: string | null;
  customAddress: string | null;
  logos: { 
    isotipo?: string; 
    isotipoWhite?: string; 
    imagotipo?: string; 
    imagotipoWhite?: string; 
    alternate?: string; 
  } | null;
  brandColors: { primary?: string; secondary?: string; optional?: string } | null;
  businessId: string;
  ecommerceCode: string | null;
  business?: { name: string, ruc: string } | null;
  _count?: { users: number };
}

const ITEMS_PER_PAGE = 9;

// Helper para obtener el logo principal
const getMainLogo = (branch: Branch): string | null => {
  if (branch.logos) {
    return branch.logos.isotipo || branch.logos.imagotipo || branch.logos.alternate || null;
  }
  return null;
};

export default function BranchesPage() {
  const { role: currentUserRole } = useAuth();
  const { data: branches, isLoading, mutate } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [rucFilter, setRucFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredBranches = useMemo(() => {
    // 🔥 CORRECCIÓN AQUÍ: Validación estricta de array
    if (!Array.isArray(branches)) return [];
    
    return branches.filter(b => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(searchLower) || 
             (b.address?.toLowerCase().includes(searchLower)) ||
             (b.business?.name.toLowerCase().includes(searchLower)) ||
             (b.ecommerceCode?.toLowerCase().includes(searchLower));

      const isIndependent = !!b.customRuc;
      const matchesRuc = rucFilter === 'ALL' || 
                         (rucFilter === 'INDEPENDENT' && isIndependent) || 
                         (rucFilter === 'MATRIX' && !isIndependent);

      return matchesSearch && matchesRuc;
    });
  }, [branches, searchTerm, rucFilter]);

  const totalPages = Math.ceil(filteredBranches.length / ITEMS_PER_PAGE) || 1;
  const paginatedBranches = filteredBranches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rucFilter]);

  const handleOpenNew = () => { setSelectedBranch(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (branch: Branch, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedBranch({ 
      id: branch.id, 
      name: branch.name, 
      address: branch.address,
      phone: branch.phone,
      customRuc: branch.customRuc,
      customLegalName: branch.customLegalName,
      customAddress: branch.customAddress,
      logos: branch.logos || null,
      brandColors: branch.brandColors || null,
      businessId: branch.businessId,
      ecommerceCode: branch.ecommerceCode,
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('🛑 ¿Eliminar esta sucursal? Asegúrate de que no haya usuarios operando en ella.')) return setOpenDropdownId(null);
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Sucursal eliminada');
      mutate();
    } catch (e: unknown) { 
      const err = e instanceof Error ? e.message : 'Error al eliminar';
      toast.error(err); 
    }
    finally { setOpenDropdownId(null); }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Sucursales</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar por nombre, código..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          <Button onClick={handleOpenNew} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nueva Sede</span>
          </Button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN INTEGRADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setRucFilter('ALL'); setCurrentPage(1)}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${rucFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Todas
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            <button 
              onClick={() => {setRucFilter('MATRIX'); setCurrentPage(1)}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${rucFilter === 'MATRIX' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Building className="w-3.5 h-3.5" /> RUC Principal
            </button>
            <button 
              onClick={() => {setRucFilter('INDEPENDENT'); setCurrentPage(1)}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${rucFilter === 'INDEPENDENT' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <ReceiptText className="w-3.5 h-3.5" /> Franquicias (RUC Propio)
            </button>
          </div>

          {/* Paginación a la derecha */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* GRID DE TARJETAS COMPACTAS (Fondo Gris Ligero) */}
        <div className="flex-1 p-4 bg-slate-50/50 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl bg-white border border-slate-200 shadow-sm" />)}
            </div>
          ) : paginatedBranches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-20 mt-4">
              <Store className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-sm text-slate-500">No se encontraron sucursales.</p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setRucFilter('ALL'); }} className="text-blue-600 font-bold">Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBranches.map((branch: Branch) => {
                const isDropdownOpen = openDropdownId === branch.id;
                const isIndependent = !!branch.customRuc;
                const mainLogo = getMainLogo(branch);

                return (
                  <div 
                    key={branch.id} 
                    onClick={() => handleOpenEdit(branch)}
                    className={`group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col overflow-hidden animate-in fade-in zoom-in-95 ${isDropdownOpen ? 'z-50' : 'z-10'}`}
                  >
                    
                    <div className="p-4 flex flex-col flex-1">
                      
                      {/* HEADER CARD: Logo, Nombre y Menú */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          {mainLogo ? (
                            <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white shadow-sm p-0.5">
                              <img src={mainLogo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                              <Store className="w-6 h-6" />
                            </div>
                          )}
                          
                          <div className="min-w-0 pr-6">
                            <h3 className="font-bold text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">{branch.name}</h3>
                            
                            {/* PALETA DE COLORES VISIBLE - Mejorada */}
                            {branch.brandColors && (branch.brandColors.primary || branch.brandColors.secondary || branch.brandColors.optional) && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {branch.brandColors.primary && (
                                  <div 
                                    className="w-4 h-4 rounded-md border-2 border-white shadow-md ring-1 ring-slate-200/50 transition-transform hover:scale-125" 
                                    style={{ backgroundColor: branch.brandColors.primary }} 
                                    title={`Principal: ${branch.brandColors.primary}`}
                                  />
                                )}
                                {branch.brandColors.secondary && (
                                  <div 
                                    className="w-4 h-4 rounded-md border-2 border-white shadow-md ring-1 ring-slate-200/50 transition-transform hover:scale-125" 
                                    style={{ backgroundColor: branch.brandColors.secondary }} 
                                    title={`Secundario: ${branch.brandColors.secondary}`}
                                  />
                                )}
                                {branch.brandColors.optional && (
                                  <div 
                                    className="w-4 h-4 rounded-md border-2 border-white shadow-md ring-1 ring-slate-200/50 transition-transform hover:scale-125" 
                                    style={{ backgroundColor: branch.brandColors.optional }} 
                                    title={`Opcional: ${branch.brandColors.optional}`}
                                  />
                                )}
                              </div>
                            )}
                            
                            {/* Ecommerce Code si lo tiene */}
                            {currentUserRole === 'SUPER_ADMIN' && branch.ecommerceCode && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-[8px] bg-slate-50 text-slate-500 border-slate-200 px-1.5 py-0 h-3.5 inline-flex items-center shadow-none">
                                  ID: {branch.ecommerceCode}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botón flotante Opciones */}
                        <div className="absolute top-3 right-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : branch.id); }}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          
                          {isDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                                <button onClick={(e) => handleOpenEdit(branch, e)} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors">
                                  <Edit className="w-4 h-4" /> Editar Sede
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                <button onClick={(e) => handleDelete(branch.id, e)} className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors">
                                  <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* DATA CARD: Dirección y Contacto */}
                      <div className="space-y-1.5 text-slate-500 flex-1 mt-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                          <span className="line-clamp-2 leading-tight text-xs font-medium">{branch.address || 'Sin dirección registrada'}</span>
                        </div>
                        {branch.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="text-xs font-medium">{branch.phone}</span>
                          </div>
                        )}
                        {currentUserRole === 'SUPER_ADMIN' && branch.business && (
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="text-xs font-medium truncate">{branch.business.name}</span>
                          </div>
                        )}
                      </div>

                      {/* FOOTER CARD: Tipo RUC y Usuarios */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <Badge variant="secondary" className={`text-[9px] font-bold px-2 py-0 h-4 shadow-none border ${isIndependent ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {isIndependent ? <><ReceiptText className="w-2.5 h-2.5 mr-1" /> {branch.customRuc}</> : 'RUC MATRIZ'}
                        </Badge>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {branch._count?.users || 0} Usuarios
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

      <BranchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} branchToEdit={selectedBranch} />
    </div>
  );
}