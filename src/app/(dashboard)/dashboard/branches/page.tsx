'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, Search, Store, Building, MapPin, Phone, ReceiptText, Trash2, Edit, ChevronLeft, ChevronRight, Filter, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton'; // 🚀 IMPORTADO PARA EL LOADING
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
  logoUrl: string | null;
  brandColors: { primary?: string; secondary?: string; optional?: string } | null;
  businessId: string;
  ecommerceCode: string | null;
  business?: { name: string, ruc: string } | null;
  _count?: { users: number };
}

const ITEMS_PER_PAGE = 6;

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
    if (!branches) return [];
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
  
  const handleOpenEdit = (branch: Branch) => {
    setSelectedBranch({ 
      id: branch.id, 
      name: branch.name, 
      address: branch.address,
      phone: branch.phone,
      customRuc: branch.customRuc,
      customLegalName: branch.customLegalName,
      customAddress: branch.customAddress,
      logoUrl: branch.logoUrl,
      brandColors: branch.brandColors || null,
      businessId: branch.businessId,
      ecommerceCode: branch.ecommerceCode,
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async (id: string) => {
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

  // 🚀 MEJORA 2: SKELETON LOADING
  if (isLoading) return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Red de Sucursales</h1>
          <p className="text-slate-500 text-sm">Administra los puntos de venta físicos y sus conexiones.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-md w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4" /> Agregar Sede
        </Button>
      </div>

      {/* BARRA DE FILTROS PREMIUM */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre, dirección, código o negocio..." 
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={rucFilter} onValueChange={setRucFilter}>
            <SelectTrigger className="w-full sm:w-[200px] shrink-0 bg-slate-50">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tipo de Facturación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las sucursales</SelectItem>
              <SelectItem value="MATRIX">Usan RUC Principal</SelectItem>
              <SelectItem value="INDEPENDENT">RUC Independiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Filtro Rápido:</span>
          <Button variant={rucFilter === 'ALL' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRucFilter('ALL')}>Todas</Button>
          <Button variant={rucFilter === 'MATRIX' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRucFilter('MATRIX')}>RUC Principal</Button>
          <Button variant={rucFilter === 'INDEPENDENT' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRucFilter('INDEPENDENT')}>Franquicias (RUC Propio)</Button>
        </div>
      </div>

      {/* LISTA DE SUCURSALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedBranches.length === 0 ? (
          // 🚀 MEJORA 3: EMPTY STATE INTERACTIVO
          <div className="col-span-full text-center py-16 bg-white border border-dashed rounded-xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No hay sucursales aquí</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              {searchTerm || rucFilter !== 'ALL' 
                ? 'No encontramos ninguna sucursal que coincida con tus filtros actuales.'
                : 'Aún no has registrado ninguna sucursal. Empieza agregando la primera ubicación física.'}
            </p>
            {searchTerm || rucFilter !== 'ALL' ? (
              <Button variant="outline" onClick={() => { setSearchTerm(''); setRucFilter('ALL'); }}>Limpiar Filtros</Button>
            ) : (
              <Button onClick={handleOpenNew} className="gap-2"><Plus className="w-4 h-4" /> Agregar mi primera Sede</Button>
            )}
          </div>
        ) : (
          paginatedBranches.map((branch: Branch) => {
            const isDropdownOpen = openDropdownId === branch.id;
            const isIndependent = !!branch.customRuc;

            return (
              <Card key={branch.id} className={`hover:shadow-md transition-shadow relative flex flex-col ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 min-w-0">
                      {branch.logoUrl ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white shadow-sm p-1">
                          <img src={branch.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Store className="w-6 h-6" />
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 leading-tight truncate">{branch.name}</h3>
                        
                        {/* 🚀 MEJORA 1: PALETA DE COLORES VISIBLE */}
                        {branch.brandColors && (
                          <div className="flex items-center gap-1 mt-1.5 mb-1">
                            <div className="w-3 h-3 rounded-full border border-slate-200/50 shadow-sm" style={{ backgroundColor: branch.brandColors.primary || '#0f172a' }} title="Principal"/>
                            <div className="w-3 h-3 rounded-full border border-slate-200/50 shadow-sm" style={{ backgroundColor: branch.brandColors.secondary || '#3b82f6' }} title="Secundario"/>
                            <div className="w-3 h-3 rounded-full border border-slate-200/50 shadow-sm" style={{ backgroundColor: branch.brandColors.optional || '#ffffff' }} title="Opcional"/>
                          </div>
                        )}

                        {currentUserRole === 'SUPER_ADMIN' && branch.business && (
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1 truncate">
                            <Building className="w-3 h-3 shrink-0" /> <span className="truncate">{branch.business.name}</span>
                          </p>
                        )}
                        
                        {currentUserRole === 'SUPER_ADMIN' && branch.ecommerceCode && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 px-1.5 py-0 h-4 inline-flex items-center gap-1">
                              <LinkIcon className="w-2.5 h-2.5" /> {branch.ecommerceCode}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2" onClick={() => setOpenDropdownId(isDropdownOpen ? null : branch.id)}>
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                      
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          <button onClick={() => handleOpenEdit(branch)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => handleDelete(branch.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 flex-1 mt-auto">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight text-xs">{branch.address || 'Sin dirección registrada'}</span>
                    </div>
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs">{branch.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className={`text-[9px] font-mono px-2 py-0 h-5 ${isIndependent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isIndependent ? <><ReceiptText className="w-3 h-3 mr-1 inline" /> {branch.customRuc}</> : 'RUC MATRIZ'}
                      </Badge>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded border">
                      {branch._count?.users || 0} Usuarios
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Página <span className="font-bold text-slate-900">{currentPage}</span> de <span className="font-bold text-slate-900">{totalPages}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <BranchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} branchToEdit={selectedBranch} />
      {openDropdownId && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />}
    </div>
  );
}