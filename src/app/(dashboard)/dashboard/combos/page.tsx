'use client';

import { useState, useEffect } from 'react';
import { PlusSignIcon, Search01Icon, FilterIcon, PackageIcon, Edit02Icon, Delete02Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NewComboModal } from '@/components/dashboard/combos/NewComboModal';
import { EditComboModal } from '@/components/dashboard/combos/EditComboModal';

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

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchCombos();
    fetchCategories();
    fetchBranches();
  }, [pagination.page, searchTerm]);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm
      });

      const res = await fetch(`/api/combos?${params}`);
      if (!res.ok) throw new Error('Error al cargar combos');
      
      const data = await res.json();
      setCombos(data.combos);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar combos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
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
        setBranches(data.branches || []);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">
            <PackageIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Combos</h1>
            <p className="text-slate-600">Gestiona los combos de productos</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
        >
          <PlusSignIcon className="w-4 h-4 mr-2" />
          Nuevo Combo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 bg-white border-b border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar combos..."
            className="h-10 pl-10 rounded-xl"
          />
        </div>
        <Button variant="outline" className="h-10 rounded-xl">
          <FilterIcon className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-500">Cargando combos...</div>
            </div>
          ) : combos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PackageIcon className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No hay combos</h3>
              <p className="text-slate-600 mb-4">Crea tu primer combo para empezar</p>
              <Button
                onClick={() => setShowNewModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                <PlusSignIcon className="w-4 h-4 mr-2" />
                Crear Combo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {combos.map((combo) => (
                <div key={combo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="aspect-square bg-slate-100 relative">
                    {combo.images.length > 0 ? (
                      <img
                        src={combo.images[0]}
                        alt={combo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PackageIcon className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        combo.active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {combo.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{combo.title}</h3>
                      <p className="text-xs text-slate-500 mb-2">{combo.category.name}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{getComboItemsPreview(combo.comboItems)}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-slate-900">S/ {combo.basePrice.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Stock: {getTotalStock(combo)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingCombo(combo)}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 rounded-lg"
                      >
                        <Edit02Icon className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteCombo(combo.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Delete02Icon className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                variant="outline"
                className="h-10 rounded-xl"
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Página {pagination.page} de {pagination.pages}
              </span>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                variant="outline"
                className="h-10 rounded-xl"
              >
                Siguiente
              </Button>
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