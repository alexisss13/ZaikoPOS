'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loading02Icon, UserMultiple02Icon, Delete02Icon, Edit02Icon, ToggleOffIcon } from 'hugeicons-react';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  representative: string | null;
  website: string | null;
  comments: string | null;
  isActive: boolean;
  _count?: {
    products: number;
    purchaseOrders: number;
  };
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suppliers: Supplier[];
}

export function SupplierModal({ isOpen, onClose, onSuccess, suppliers }: SupplierModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    email: '',
    phone: '',
    representative: '',
    website: '',
    comments: '',
  });

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name,
        ruc: (editingSupplier as any).ruc || '',
        email: editingSupplier.email || '',
        phone: editingSupplier.phone || '',
        representative: editingSupplier.representative || '',
        website: editingSupplier.website || '',
        comments: editingSupplier.comments || '',
      });
    } else {
      setFormData({
        name: '',
        ruc: '',
        email: '',
        phone: '',
        representative: '',
        website: '',
        comments: '',
      });
    }
  }, [editingSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        ruc: formData.ruc || null,
        email: formData.email || null,
        phone: formData.phone || null,
        representative: formData.representative || null,
        website: formData.website || null,
        comments: formData.comments || null,
      };

      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado');
      setEditingSupplier(null);
      setFormData({
        name: '',
        ruc: '',
        email: '',
        phone: '',
        representative: '',
        website: '',
        comments: '',
      });
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrDeactivate = async (supplier: Supplier) => {
    const hasRelations = (supplier._count?.products || 0) > 0 || (supplier._count?.purchaseOrders || 0) > 0;
    
    if (hasRelations) {
      // Si tiene productos o compras relacionadas, solo desactivar
      if (!confirm(`Este proveedor tiene productos o compras relacionadas. ¿Deseas desactivarlo? Podrás reactivarlo después.`)) {
        return;
      }
      
      try {
        const res = await fetch(`/api/suppliers/${supplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...supplier, isActive: false }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        
        toast.success('Proveedor desactivado');
        onSuccess();
      } catch (error: any) {
        toast.error(error.message || 'Error al desactivar');
      }
    } else {
      // Si no tiene relaciones, eliminar directamente
      if (!confirm('¿Eliminar este proveedor? No tiene productos ni compras asociadas.')) return;
      
      try {
        const res = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        toast.success('Proveedor eliminado');
        onSuccess();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setEditingSupplier(null); } }}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <UserMultiple02Icon size={20} strokeWidth={2} className="text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              Gestionar Proveedores
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Crea, edita o desactiva proveedores
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* FORMULARIO */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit">
            <h3 className="text-sm font-black text-slate-900 mb-4">
              {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Nombre */}
              <div className="relative">
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=" " 
                  className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  required 
                />
                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                  Nombre <span className="text-red-500">*</span>
                </label>
              </div>

              {/* RUC */}
              <div className="relative">
                <input 
                  name="ruc" 
                  value={formData.ruc} 
                  onChange={(e) => setFormData(prev => ({ ...prev, ruc: e.target.value }))}
                  placeholder=" " 
                  className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                />
                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                  RUC
                </label>
              </div>

              {/* Email y Teléfono */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                    Email
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                    Teléfono
                  </label>
                </div>
              </div>

              {/* Representante y Website */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    name="representative" 
                    value={formData.representative} 
                    onChange={(e) => setFormData(prev => ({ ...prev, representative: e.target.value }))}
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                    Representante
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="website" 
                    value={formData.website} 
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                    Website
                  </label>
                </div>
              </div>

              {/* Comentarios */}
              <div className="relative">
                <textarea 
                  name="comments" 
                  value={formData.comments} 
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder=" " 
                  rows={3}
                  className="peer w-full px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 resize-none"
                />
                <label className="absolute left-3 top-3 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                  Comentarios
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                {editingSupplier && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingSupplier(null);
                      setFormData({
                        name: '',
                        ruc: '',
                        email: '',
                        phone: '',
                        representative: '',
                        website: '',
                        comments: '',
                      });
                    }}
                    className="flex-1 h-10 text-xs font-bold"
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isLoading && <Loading02Icon size={16} strokeWidth={2} className="mr-2 animate-spin" />}
                  {editingSupplier ? 'Actualizar' : 'Crear'}
                </Button>
              </div>

            </form>
          </div>

          {/* LISTA DE PROVEEDORES */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">
                Proveedores Existentes ({suppliers.filter(s => statusFilter === 'ACTIVE' ? s.isActive : !s.isActive).length})
              </h3>
              
              {/* Filtro por estado */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Inactivos
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {suppliers.filter(s => statusFilter === 'ACTIVE' ? s.isActive : !s.isActive).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {statusFilter === 'ACTIVE' ? 'No hay proveedores activos' : 'No hay proveedores inactivos'}
                </div>
              ) : (
                suppliers.filter(s => statusFilter === 'ACTIVE' ? s.isActive : !s.isActive).map((supplier) => {
                  const hasRelations = (supplier._count?.products || 0) > 0 || (supplier._count?.purchaseOrders || 0) > 0;
                  
                  return (
                    <div 
                      key={supplier.id}
                      className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group ${
                        !supplier.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                        <UserMultiple02Icon size={20} strokeWidth={2} className="text-slate-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {supplier.name}
                          {!supplier.isActive && (
                            <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                              INACTIVO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                          {supplier.email && <div className="truncate">{supplier.email}</div>}
                          {supplier.phone && <div>{supplier.phone}</div>}
                          {supplier.representative && <div className="truncate">Rep: {supplier.representative}</div>}
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {supplier.isActive ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSupplier(supplier)}
                              className="h-8 w-8 p-0 hover:bg-slate-200"
                            >
                              <Edit02Icon size={14} strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrDeactivate(supplier)}
                              className={`h-8 w-8 p-0 ${hasRelations ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-red-100 text-red-600'}`}
                              title={hasRelations ? 'Desactivar proveedor' : 'Eliminar proveedor'}
                            >
                              {hasRelations ? <ToggleOffIcon size={14} strokeWidth={2} /> : <Delete02Icon size={14} strokeWidth={2} />}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('¿Reactivar este proveedor?')) return;
                              try {
                                const res = await fetch(`/api/suppliers/${supplier.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...supplier, isActive: true }),
                                });
                                if (!res.ok) {
                                  const data = await res.json();
                                  throw new Error(data.error);
                                }
                                toast.success('Proveedor reactivado');
                                onSuccess();
                              } catch (error: any) {
                                toast.error(error.message || 'Error al reactivar');
                              }
                            }}
                            className="h-8 px-3 hover:bg-green-100 text-green-600 text-xs font-bold"
                            title="Reactivar proveedor"
                          >
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <Button 
            variant="outline" 
            onClick={() => { onClose(); setEditingSupplier(null); }}
            className="h-10 text-xs font-bold text-slate-700"
          >
            Cerrar
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
