'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, UserMultiple02Icon, PlusSignIcon, Edit02Icon, Cancel01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SuppliersMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ruc: string | null;
  address: string | null;
  isActive: boolean;
}

export function SuppliersMobileForm({ onClose, onSuccess }: SuppliersMobileFormProps) {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ruc: '',
    address: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      ruc: '',
      address: '',
    });
    setEditingSupplier(null);
  };

  const handleCreate = () => {
    resetForm();
    setView('create');
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      ruc: supplier.ruc || '',
      address: supplier.address || '',
    });
    setEditingSupplier(supplier);
    setView('edit');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        ruc: formData.ruc.trim() || null,
        address: formData.address.trim() || null,
        isActive: true,
      };

      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar proveedor');
      }

      toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado');
      await loadSuppliers();
      setView('list');
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al guardar proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplier,
          isActive: !supplier.isActive,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al actualizar proveedor');
      }

      toast.success(supplier.isActive ? 'Proveedor desactivado' : 'Proveedor activado');
      await loadSuppliers();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar proveedor');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={view === 'list' ? onClose : () => setView('list')}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">
            {view === 'list' ? 'Proveedores' : view === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
          </h2>
          <p className="text-xs text-slate-500">
            {view === 'list' ? 'Gestionar proveedores' : 'Información del proveedor'}
          </p>
        </div>
        {view === 'list' && (
          <Button
            onClick={handleCreate}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
          >
            <PlusSignIcon className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        )}
        {(view === 'create' || view === 'edit') && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'list' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserMultiple02Icon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sin proveedores</h3>
                <p className="text-sm text-slate-600 mb-4">
                  No hay proveedores registrados
                </p>
                <Button onClick={handleCreate} className="bg-slate-900 hover:bg-slate-800 text-white">
                  <PlusSignIcon className="w-4 h-4 mr-2" />
                  Crear primer proveedor
                </Button>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`bg-white rounded-2xl border border-slate-200 p-4 ${
                    !supplier.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900">{supplier.name}</h3>
                      {supplier.ruc && (
                        <p className="text-xs text-slate-500">RUC: {supplier.ruc}</p>
                      )}
                      {supplier.email && (
                        <p className="text-xs text-slate-500">{supplier.email}</p>
                      )}
                      {supplier.phone && (
                        <p className="text-xs text-slate-500">{supplier.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        <Edit02Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className={`text-xs font-bold ${
                      supplier.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(supplier)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        supplier.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {supplier.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-bold text-slate-700 mb-2 block">
                Nombre del proveedor *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Distribuidora ABC S.A.C."
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="ruc" className="text-sm font-bold text-slate-700 mb-2 block">
                RUC (opcional)
              </Label>
              <Input
                id="ruc"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                placeholder="Ej: 20123456789"
                className="h-12 rounded-xl"
                maxLength={11}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 mb-2 block">
                Email (opcional)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@proveedor.com"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-bold text-slate-700 mb-2 block">
                Teléfono (opcional)
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +51 999 123 456"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-bold text-slate-700 mb-2 block">
                Dirección (opcional)
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}