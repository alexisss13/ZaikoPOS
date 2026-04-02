'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Plus, Search, Tags, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, LayoutGrid, Store, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryModal, CategoryData } from '@/components/dashboard/CategoryModal';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Category {
  id: string;
  name: string;
  slug: string;
  ecommerceCode: string | null;
  image: string | null;
  _count?: { products: number };
}

interface Branch {
  id: string;
  ecommerceCode: string | null;
  name: string;
  logoUrl?: string | null;
}

const ITEMS_PER_PAGE = 12;

export default function CategoriesPage() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canCreate = isSuperOrOwner || !!permissions.canCreateProducts || canManageGlobal;
  const canEdit = isSuperOrOwner || !!permissions.canEditProducts || canManageGlobal;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  const { data: categories, isLoading, mutate } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const myBranch = branches?.find(b => b.id === user?.branchId);
  const myCode = myBranch?.ecommerceCode;

  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const getBranchByCode = (code: string) => branches?.find(b => b.ecommerceCode === code);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c => {
      const isGlobal = !c.ecommerceCode;
      const isMyCatalog = c.ecommerceCode === myCode;

      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal) {
        if (!isGlobal && !isMyCatalog) return false;
      }

      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesCode = true;
      if (codeFilter !== 'ALL') matchesCode = c.ecommerceCode === codeFilter;
      
      return matchesSearch && matchesCode;
    });
  }, [categories, searchTerm, codeFilter, myCode, isSuperOrOwner, canViewOthers, canManageGlobal]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleOpenNew = () => { setSelectedCategory(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory({ id: cat.id, name: cat.name, slug: cat.slug, ecommerceCode: cat.ecommerceCode, image: cat.image });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('🛑 ¿Eliminar esta categoría? Asegúrate de que no tenga productos asignados.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Categoría eliminada');
      mutate();
    } catch (err: unknown) { 
      toast.error('No se puede eliminar porque tiene productos vinculados.'); 
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* 🚀 TOOLBAR SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Categorías</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar categoría..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          {canCreate && (
            <Button onClick={handleOpenNew} className="h-10 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-5 shadow-md rounded-full transition-all shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nueva Categoría</span>
            </Button>
          )}
        </div>
      </div>

      {/* 🚀 TABS Y PAGINACIÓN INTEGRADA (Subheader) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pb-1 border-b border-slate-200/60">
        
        {/* Pestañas (Filtros por sucursal) */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
          <button 
            onClick={() => {setCodeFilter('ALL'); setCurrentPage(1)}} 
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${codeFilter === 'ALL' ? 'bg-slate-900 text-white border-transparent' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/60'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Todas
          </button>
          
          {visibleCodes.map(code => {
            const b = getBranchByCode(code);
            const isActive = codeFilter === code;
            return (
              <button 
                key={code} 
                onClick={() => {setCodeFilter(code); setCurrentPage(1)}} 
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${isActive ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/60'}`}
              >
                {b?.logoUrl ? <img src={b.logoUrl} className="w-4 h-4 rounded-sm object-cover bg-white" alt=""/> : <Store className="w-3.5 h-3.5"/>}
                {b?.name || code}
              </button>
            )
          })}
        </div>

        {/* Paginación ubicada a la derecha del subheader */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 shrink-0 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
              Pág {currentPage} de {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" className="h-8 w-8 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="h-8 w-8 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 GRID DE TARJETAS COMPACTAS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl bg-white border border-slate-200 shadow-sm" />)}
          </div>
        ) : paginatedCategories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-2xl border border-dashed border-slate-200 py-20 mt-4">
            <Tags className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium text-sm text-slate-500">No se encontraron categorías.</p>
            <Button variant="link" onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); }} className="text-blue-600 font-bold">Limpiar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {paginatedCategories.map((cat: Category) => {
              const bCode = cat.ecommerceCode;
              const catBranch = bCode ? getBranchByCode(bCode) : null;
              
              let canEditThis = false;
              if (canManageGlobal) canEditThis = true;
              else if (canEdit && (bCode === myCode || !bCode)) canEditThis = true;

              return (
                <div 
                  key={cat.id} 
                  onClick={() => handleOpenEdit(cat)}
                  className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 hover:ring-1 hover:ring-slate-300 transition-all cursor-pointer flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
                >
                  {/* Botón de Eliminar Oculto */}
                  {canEditThis && (
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md bg-red-500 hover:bg-red-600 border-2 border-white" onClick={(e) => handleDelete(cat.id, e)}>
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </Button>
                    </div>
                  )}

                  {/* Imagen de Categoría */}
                  <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden group-hover:opacity-90 transition-opacity border-b border-slate-100 flex items-center justify-center">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon className="w-10 h-10" strokeWidth={1.5} /></div>
                    )}
                  </div>

                  {/* Información Compacta */}
                  <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1 bg-white">
                    {/* 🚀 FIX: font-bold en lugar de font-black */}
                    <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1" title={cat.name}>
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">/{cat.slug}</p>
                    
                    <div className="mt-auto pt-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                      
                      {/* Etiqueta Visual Dinámica */}
                      {bCode ? (
                        <span className="text-[9px] font-bold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">
                          {catBranch?.logoUrl ? <img src={catBranch.logoUrl} className="w-3 h-3 rounded-[2px] object-cover bg-white" alt=""/> : <Store className="w-3 h-3 text-slate-500" />} 
                          {catBranch?.name || bCode}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max">
                          <Globe className="w-2.5 h-2.5 text-slate-400" /> Compartida
                        </span>
                      )}

                      {/* Contador de Productos */}
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-max whitespace-nowrap group-hover:text-slate-800 transition-colors">
                        {cat._count?.products || 0} Prod.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()} 
        categoryToEdit={selectedCategory} 
      />
    </div>
  );
}