'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, 
  CheckCircle2, XCircle, Users, Store, PowerOff, Trash2, Mail,
  Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

const ITEMS_PER_PAGE = 2; // Cambia esto si quieres mostrar más o menos por página

export default function BusinessesPage() {
  const { data: businesses, isLoading, mutate } = useSWR<Business[]>('/api/businesses', fetcher);
  
  // 🚀 ESTADOS PARA LA UI DE BÚSQUEDA Y PAGINACIÓN
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 🚀 LÓGICA DE FILTRADO Y BÚSQUEDA (Se recalcula automáticamente)
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    
    return businesses.filter(biz => {
      // 1. Filtro por Búsqueda (Nombre o Correo)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        biz.name.toLowerCase().includes(searchLower) || 
        (biz.users[0]?.email.toLowerCase().includes(searchLower) ?? false);

      // 2. Filtro por Estado
      let matchesStatus = true;
      if (filterStatus === 'ACTIVE') matchesStatus = biz.isActive === true;
      if (filterStatus === 'SUSPENDED') matchesStatus = biz.isActive === false;
      if (filterStatus === 'PENDING') matchesStatus = biz.ruc.startsWith('PENDING');

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, filterStatus]);

  // 🚀 LÓGICA DE PAGINACIÓN
  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE) || 1;
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Reiniciar a la página 1 cuando el usuario busca o filtra algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);


  // Acciones (Mantienen igual)
  const handleOpenNew = () => { setSelectedBusiness(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (biz: Business) => {
    setSelectedBusiness({ id: biz.id, name: biz.name, maxBranches: biz.maxBranches, maxManagers: biz.maxManagers || 1, maxEmployees: biz.maxEmployees });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleToggleStatus = async (biz: Business) => {
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

  const handleDelete = async (bizId: string) => {
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando ecosistema SaaS...</div>;

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes del SaaS</h1>
          <p className="text-slate-500 text-sm">Gestiona la cartera de negocios de tu plataforma.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-md w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Registrar Dueño
        </Button>
      </div>

      {/* 🚀 BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por negocio o correo del dueño..." 
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING'] as const).map((status) => (
              <Button 
                key={status} 
                variant={filterStatus === status ? 'default' : 'outline'} 
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'ALL' && 'Todos'}
                {status === 'ACTIVE' && 'Activos'}
                {status === 'SUSPENDED' && 'Suspendidos'}
                {status === 'PENDING' && 'Pendientes RUC'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedBusinesses.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron negocios</p>
          </div>
        ) : (
          paginatedBusinesses.map((biz: Business) => {
            const isPending = biz.ruc.startsWith('PENDING');
            const owner = biz.users[0];
            const isDropdownOpen = openDropdownId === biz.id;

            return (
              <Card key={biz.id} className={`hover:shadow-md transition-all relative ${!biz.isActive ? 'opacity-80 grayscale-[30%]' : ''} ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
                    
                    <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-inner ${biz.isActive ? 'bg-slate-900' : 'bg-slate-400'}`}>
                        {biz.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 flex flex-wrap items-center gap-2 text-base sm:text-lg leading-tight">
                          <span className="truncate">{biz.name}</span>
                          {biz.isActive ? (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 gap-1 px-1.5 py-0"><CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Activa</span></Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 px-1.5 py-0"><XCircle className="w-3 h-3" /> <span className="hidden sm:inline">Suspendida</span></Badge>
                          )}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 mt-1.5">
                          {owner ? (
                            <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{owner.email}</span></span>
                          ) : (
                            <span className="text-red-400">Sin dueño asignado</span>
                          )}
                          <span className="hidden sm:inline text-slate-300">•</span>
                          {isPending ? (
                            <span className="text-orange-500 text-[10px] sm:text-xs bg-orange-50 px-2 py-0.5 rounded border border-orange-200 w-fit">Falta configurar RUC</span>
                          ) : (
                            <span className="font-mono text-xs">RUC: {biz.ruc}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 py-3 rounded-lg border w-full xl:w-auto">
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">Sucursales</p>
                        <p className="font-bold text-slate-700 flex items-center gap-1 sm:gap-1.5 text-base sm:text-lg"><Store className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" /> {biz.maxBranches}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">Jefes / Suc</p>
                        <p className="font-bold text-slate-700 flex items-center gap-1 sm:gap-1.5 text-base sm:text-lg"><Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" /> {biz.maxManagers || 1}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">Cajeros / Suc</p>
                        <p className="font-bold text-slate-700 flex items-center gap-1 sm:gap-1.5 text-base sm:text-lg"><Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" /> {biz.maxEmployees}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full xl:w-auto justify-end relative mt-2 xl:mt-0">
                      <Button variant="outline" className="flex-1 xl:flex-none" onClick={() => handleOpenEdit(biz)}>Límites</Button>
                      <Button variant="ghost" size="icon" className="shrink-0 bg-slate-100 xl:bg-transparent" onClick={() => setOpenDropdownId(openDropdownId === biz.id ? null : biz.id)}>
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </Button>

                      {isDropdownOpen && (
                        <div className="absolute top-12 right-0 w-48 bg-white border rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                          <button onClick={() => handleToggleStatus(biz)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium">
                            <PowerOff className={`w-4 h-4 shrink-0 ${biz.isActive ? 'text-orange-500' : 'text-emerald-500'}`} />
                            {biz.isActive ? 'Suspender Servicio' : 'Activar Servicio'}
                          </button>
                          {!biz.isActive && (
                            <button onClick={() => handleDelete(biz.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t font-medium">
                              <Trash2 className="w-4 h-4 shrink-0" /> Eliminar Definitiva
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 🚀 CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBusinesses.length)}</span> de <span className="font-bold text-slate-900">{filteredBusinesses.length}</span> clientes
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <BusinessModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} businessToEdit={selectedBusiness} />
      {openDropdownId && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />}
    </div>
  );
}