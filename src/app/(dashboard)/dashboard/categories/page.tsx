'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Plus, MoreVertical, Search, Tags, Package, Trash2, Edit, ChevronLeft, ChevronRight, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryModal, CategoryData } from '@/components/dashboard/CategoryModal';

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
}

const ITEMS_PER_PAGE = 8; 

export default function CategoriesPage() {
  const { data: categories, isLoading, mutate } = useSWR<Category[]>('/api/categories', fetcher);
  
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesCode = true;
      if (codeFilter === 'GENERAL') matchesCode = !c.ecommerceCode;
      else if (codeFilter !== 'ALL') matchesCode = c.ecommerceCode === codeFilter;
      
      return matchesSearch && matchesCode;
    });
  }, [categories, searchTerm, codeFilter]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleOpenNew = () => { setSelectedCategory(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory({ id: cat.id, name: cat.name, slug: cat.slug, ecommerceCode: cat.ecommerceCode, image: cat.image });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('🛑 ¿Eliminar esta categoría? No podrás hacerlo si tiene productos asignados.')) return setOpenDropdownId(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Categoría eliminada');
      mutate();
    } catch (e: unknown) { 
      const err = e instanceof Error ? e.message : 'Error inesperado';
      toast.error(err); 
    }
    finally { setOpenDropdownId(null); }
  };

  // 🚀 ESTILOS PARA LOS TABS MODERNOS (Iguales a Productos)
  const baseTabClass = "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer";
  const activeTabClass = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50";
  const inactiveTabClass = "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";

  if (isLoading) return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end gap-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-32" /></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Tags className="w-6 h-6 text-primary" /> Categorías</h1>
          <p className="text-slate-500 text-sm mt-1">Organiza tu catálogo de productos separando las marcas web.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-md w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4" /> Crear Categoría
        </Button>
      </div>

      {/* 🚀 PANEL DE BÚSQUEDA Y FILTROS PREMIUM */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Fila 1: Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar categoría por nombre o slug..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="pl-9 h-10 w-full bg-slate-50/50 focus-visible:bg-white transition-colors" 
          />
        </div>

        {/* Fila 2: Vistas Segmentadas */}
        {uniqueCodes.length > 0 && (
          <div className="flex items-center overflow-x-auto hide-scrollbar pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg border border-slate-200/60 w-max">
              
              <button 
                onClick={() => {setCodeFilter('ALL'); setCurrentPage(1)}} 
                className={`${baseTabClass} ${codeFilter === 'ALL' ? activeTabClass : inactiveTabClass}`}
              >
                Todas
              </button>
              

              {uniqueCodes.map(code => (
                <button 
                  key={code} 
                  onClick={() => {setCodeFilter(code); setCurrentPage(1)}} 
                  className={`${baseTabClass} ${codeFilter === code ? activeTabClass : inactiveTabClass}`}
                >
                  {code}
                </button>
              ))}

            </div>
          </div>
        )}
      </div>

      {/* GRID DE RESULTADOS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {paginatedCategories.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
            <Tags className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600 mb-1">No se encontraron categorías</p>
            <Button variant="link" onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); }} className="text-primary">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          paginatedCategories.map((cat: Category) => {
            const isDropdownOpen = openDropdownId === cat.id;

            return (
              <Card key={cat.id} className={`hover:shadow-md transition-shadow overflow-hidden relative group ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <div className="absolute top-2 right-2 z-20">
                  <Button variant="secondary" size="icon" className="h-7 w-7 bg-white/90 backdrop-blur border shadow-sm hover:bg-white" onClick={() => setOpenDropdownId(isDropdownOpen ? null : cat.id)}>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                      <button onClick={() => handleOpenEdit(cat)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Edit className="w-4 h-4" /> Editar</button>
                      <button onClick={() => handleDelete(cat.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"><Trash2 className="w-4 h-4" /> Eliminar</button>
                    </div>
                  )}
                </div>

                <div className="h-28 sm:h-32 bg-slate-100 relative border-b overflow-hidden group-hover:opacity-90 transition-opacity">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                  )}
                  {cat.ecommerceCode ? (
                    <Badge variant="secondary" className="absolute bottom-2 left-2 text-[9px] uppercase font-bold bg-indigo-50/90 text-indigo-700 backdrop-blur shadow-sm flex items-center gap-1 border-indigo-200">
                      <LinkIcon className="w-2.5 h-2.5" /> {cat.ecommerceCode}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="absolute bottom-2 left-2 text-[9px] uppercase font-bold bg-white/90 text-slate-500 backdrop-blur shadow-sm border border-slate-200">
                      Compartida
                    </Badge>
                  )}
                </div>

                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-bold text-slate-900 leading-tight truncate" title={cat.name}>{cat.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={`/${cat.slug}`}>/{cat.slug}</p>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-slate-700">{cat._count?.products || 0}</span> productos
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm mt-6">
          <p className="text-sm text-slate-500">Pág. <span className="font-bold text-slate-900">{currentPage}</span> de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
      
      <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} categoryToEdit={selectedCategory} />
      {openDropdownId && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />}
    </div>
  );
}