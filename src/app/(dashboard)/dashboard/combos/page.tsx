'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PlusSignIcon, Search01Icon, CheckListIcon, Edit02Icon, Delete02Icon, 
  ArrowLeft01Icon, ArrowRight01Icon, LayoutGridIcon, Tag01Icon, ThumbsUpIcon, ThumbsDownIcon 
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { NewComboModal } from '@/components/dashboard/combos/NewComboModal';
import { EditComboModal } from '@/components/dashboard/combos/EditComboModal';
import { useAuth } from '@/context/auth-context';

interface ComboItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: number;
    product: {
      id: string;
      title: string;
      images: string[];
    };
  };
}

interface Combo {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  images: string[];
  active: boolean;
  category: {
    id: string;
    name: string;
  };
  comboItems: ComboItem[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: Array<{
      branchId: string;
      quantity: number;
    }>;
  }>;
  createdAt: string;
}

const ITEMS_PER_PAGE = 9;

export default function CombosPage() {
  const { role } = useAuth();
  const canCreate = role === 'SUPER_ADMIN' || role === 'OWNER' || role === 'MANAGER';

  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCombos();
    fetchCategories();
    fetchBranches();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Cargar todos para filtrar en cliente
        search: ''
      });

      const res = await fetch(`/api/combos?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al cargar combos');
      }
      
      const data = await res.json();
      if (Array.isArray(data.combos)) {
        setCombos(data.combos);
      } else {
        setCombos([]);
        console.error('API no devolvió un array de combos');
      }
    } catch (error) {
      console.error(error);
      setCombos([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar combos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este combo?')) return;

    try {
      const res = await fetch(`/api/combos/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar combo');

      toast.success('Combo desactivado correctamente');
      fetchCombos();
    } catch (error) {
      console.error(error);
      toast.error('Error al desactivar combo');
    }
  };

  const getTotalStock = (combo: Combo) => {
    if (!combo.variants[0]?.stock) return 0;
    return combo.variants[0].stock.reduce((total, stock) => total + stock.quantity, 0);
  };

  const getComboItemsPreview = (items: ComboItem[]) => {
    if (items.length === 0) return 'Sin productos';
    if (items.length === 1) return `${items[0].quantity}x ${items[0].variant.product.title}`;
    return `${items.length} productos`;
  };

  // Filtrado
  const filteredCombos = useMemo(() => {
    return combos.filter(combo => {
      const matchesSearch = searchTerm === '' || 
        combo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combo.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'ALL' || combo.category.id === categoryFilter;
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && combo.active) ||
        (statusFilter === 'INACTIVE' && !combo.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [combos, searchTerm, categoryFilter, statusFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredCombos.length / ITEMS_PER_PAGE) || 1;
  const paginatedCombos = filteredCombos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0 flex items-center gap-3">
          Combos <CheckListIcon className="w-6 h-6 text-slate-600" strokeWidth={2.5} />
        </h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar combos..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          {canCreate && (
            <Button 
              onClick={() => setShowNewModal(true)} 
              className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
            >
              <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> 
              <span className="font-bold">Nuevo Combo</span>
            </Button>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-2xl flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setStatusFilter('ALL'); setCategoryFilter('ALL'); setCurrentPage(1)}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'ALL' && categoryFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <LayoutGridIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Todos
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            
            <button 
            onClick={() => {setStatusFilter('ACTIVE'); setCurrentPage(1)}} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'ACTIVE' ? 'bg-green-100 text-green-800 shadow-sm' : 'text-slate-500 hover:text-green-700 hover:bg-green-50'}`}>
            <ThumbsUpIcon className="w-3.5 h-3.5" /> Activos</button>
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            <button 
            onClick={() => {setStatusFilter('INACTIVE'); setCurrentPage(1)}} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'INACTIVE' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}>
            <ThumbsDownIcon className="w-3.5 h-3.5" /> Inactivos</button>

            {categories.length > 0 && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
                {categories.slice(0, 3).map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => {setCategoryFilter(cat.id); setCurrentPage(1)}} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${categoryFilter === cat.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <Tag01Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> {cat.name}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                >
                  <ArrowLeft01Icon className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button 
                  variant="outline" 
                  className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                >
                  <ArrowRight01Icon className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* GRID DE TARJETAS */}
        <div className="flex-1 p-4 bg-slate-50/50 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-80 w-full rounded-2xl bg-white border border-slate-200 shadow-sm" />)}
            </div>
          ) : paginatedCombos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-20 mt-4">
              <CheckListIcon className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1.5} />
              <p className="font-medium text-sm text-slate-500 mb-2">No se encontraron combos.</p>
              {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <Button 
                  variant="link" 
                  onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); }} 
                  className="text-blue-600 font-bold"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCombos.map((combo) => (
                <div 
                  key={combo.id} 
                  className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden animate-in fade-in zoom-in-95"
                >
                  {/* Image */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {combo.images.length > 0 ? (
                      <img
                        src={combo.images[0]}
                        alt={combo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CheckListIcon className="w-16 h-16 text-slate-300" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge 
                        variant={combo.active ? 'default' : 'secondary'} 
                        className={`text-[9px] font-bold px-2 py-0 h-5 shadow-sm ${
                          combo.active 
                            ? 'bg-emerald-500 text-white border-emerald-600' 
                            : 'bg-red-500 text-white border-red-600'
                        }`}
                      >
                        {combo.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 leading-tight">{combo.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[8px] bg-slate-50 text-slate-500 border-slate-200 px-1.5 py-0 h-3.5">
                          {combo.category.name}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{getComboItemsPreview(combo.comboItems)}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3 pb-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-lg font-black text-slate-900">S/ {combo.basePrice.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Stock: {getTotalStock(combo)} unidades</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingCombo(combo)}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50"
                      >
                        <Edit02Icon className="w-3 h-3 mr-1" strokeWidth={1.5} />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteCombo(combo.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Delete02Icon className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {showNewModal && (
        <NewComboModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            fetchCombos();
          }}
          categories={categories}
          branches={branches}
        />
      )}

      {editingCombo && (
        <EditComboModal
          combo={editingCombo}
          onClose={() => setEditingCombo(null)}
          onSuccess={() => {
            setEditingCombo(null);
            fetchCombos();
          }}
          categories={categories}
          branches={branches}
        />
      )}
    </div>
  );
}
