'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, PlusSignIcon, Search01Icon, PackageIcon, Edit02Icon, Delete02Icon, FilterIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NewComboMobileForm } from './NewComboMobileForm';
import { EditComboMobileForm } from './EditComboMobileForm';

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

interface CombosMobileProps {
  onClose: () => void;
}

export function CombosMobile({ onClose }: CombosMobileProps) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCombos(true);
    fetchCategories();
    fetchBranches();
  }, [searchTerm]);

  const fetchCombos = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '5',
        search: searchTerm
      });

      const res = await fetch(`/api/combos?${params}`);
      if (!res.ok) throw new Error('Error al cargar combos');
      
      const data = await res.json();
      
      if (reset) {
        setCombos(data.combos);
      } else {
        setCombos(prev => [...prev, ...data.combos]);
      }
      
      setHasMore(currentPage < data.pagination.pages);
      setPage(currentPage + 1);
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
      fetchCombos(true);
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

  if (showNewForm) {
    return (
      <NewComboMobileForm
        onClose={() => setShowNewForm(false)}
        onSuccess={() => {
          setShowNewForm(false);
          fetchCombos(true);
        }}
        categories={categories}
        branches={branches}
      />
    );
  }

  if (editingCombo) {
    return (
      <EditComboMobileForm
        combo={editingCombo}
        onClose={() => setEditingCombo(null)}
        onSuccess={() => {
          setEditingCombo(null);
          fetchCombos(true);
        }}
        categories={categories}
        branches={branches}
      />
    );
  }

  if (selectedCombo) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSelectedCombo(null)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Detalle del Combo</h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setEditingCombo(selectedCombo)}
              size="sm"
              className="h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              <Edit02Icon className="w-3 h-3 mr-1" />
              Editar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Image */}
          <div className="aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden">
            {selectedCombo.images.length > 0 ? (
              <img
                src={selectedCombo.images[0]}
                alt={selectedCombo.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PackageIcon className="w-16 h-16 text-slate-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 mb-1">{selectedCombo.title}</h1>
              <p className="text-sm text-slate-500 mb-2">{selectedCombo.category.name}</p>
              <p className="text-2xl font-black text-slate-900">S/ {selectedCombo.basePrice.toFixed(2)}</p>
            </div>

            {selectedCombo.description && (
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Descripción</h3>
                <p className="text-slate-600">{selectedCombo.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-bold text-slate-900 mb-3">Productos incluidos</h3>
              <div className="space-y-3">
                {selectedCombo.comboItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                      {item.variant.product.images?.[0] ? (
                        <img src={item.variant.product.images[0]} alt={item.variant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PackageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.variant.product.title}</p>
                      <p className="text-sm text-slate-600">{item.variant.name}</p>
                      <p className="text-sm font-bold text-slate-900">S/ {item.variant.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{item.quantity}x</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Stock disponible</h3>
              <p className="text-lg font-bold text-slate-900">{getTotalStock(selectedCombo)} unidades</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/30">
      {/* Header móvil estilo HR - separado del contenido */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
            </button>
            <div className="p-2 bg-slate-100 rounded-xl">
              <PackageIcon className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-900 leading-tight">Combos</h2>
              <p className="text-xs text-slate-500 font-semibold">{combos.length} combos encontrados</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewForm(true)}
            className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm px-4"
          >
            <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={2} />
            Nuevo
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={2.5} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar combos..."
            className="w-full bg-slate-50 border-slate-200 pl-10 h-11 rounded-xl font-semibold"
          />
        </div>
      </div>

      {/* Content con fondo gris */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {loading && combos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Cargando combos...</div>
          </div>
        ) : combos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <PackageIcon className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No hay combos</h3>
            <p className="text-slate-600 mb-4">Crea tu primer combo para empezar</p>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              <PlusSignIcon className="w-4 h-4 mr-2" />
              Crear Combo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {combos.map((combo) => (
              <div
                key={combo.id}
                onClick={() => setSelectedCombo(combo)}
                className="bg-white border border-slate-200 rounded-2xl p-4 active:scale-95 transition-all"
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    {combo.images.length > 0 ? (
                      <img
                        src={combo.images[0]}
                        alt={combo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PackageIcon className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{combo.title}</h3>
                        <p className="text-xs text-slate-500">{combo.category.name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ml-2 ${
                        combo.active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {combo.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-2">{getComboItemsPreview(combo.comboItems)}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">S/ {combo.basePrice.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Stock: {getTotalStock(combo)}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCombo(combo);
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          <Edit02Icon className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCombo(combo.id);
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Delete02Icon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4">
                <Button
                  onClick={() => fetchCombos(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  {loading ? 'Cargando...' : `Cargar más (${combos.length} de muchos)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}