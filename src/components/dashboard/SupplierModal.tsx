'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Mail, Phone, Globe, User, MessageSquare } from 'lucide-react';

export interface SupplierData {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  representative: string | null;
  website: string | null;
  comments: string | null;
  isActive: boolean;
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: SupplierData | null;
}

export function SupplierModal({ isOpen, onClose, onSuccess, supplierToEdit }: SupplierModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    representative: '',
    website: '',
    comments: '',
    isActive: true,
  });

  useEffect(() => {
    if (supplierToEdit && isOpen) {
      setFormData({
        name: supplierToEdit.name,
        email: supplierToEdit.email || '',
        phone: supplierToEdit.phone || '',
        representative: supplierToEdit.representative || '',
        website: supplierToEdit.website || '',
        comments: supplierToEdit.comments || '',
        isActive: supplierToEdit.isActive,
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        representative: '',
        website: '',
        comments: '',
        isActive: true,
      });
    }
  }, [supplierToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email.trim() === '' ? null : formData.email,
        phone: formData.phone.trim() === '' ? null : formData.phone,
        representative: formData.representative.trim() === '' ? null : formData.representative,
        website: formData.website.trim() === '' ? null : formData.website,
        comments: formData.comments.trim() === '' ? null : formData.comments,
      };

      const url = supplierToEdit?.id ? `/api/suppliers/${supplierToEdit.id}` : '/api/suppliers';
      const method = supplierToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(supplierToEdit?.id ? 'Proveedor actualizado correctamente' : 'Proveedor creado exitosamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (val: string | undefined) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-sm w-full rounded-xl border px-3 h-10 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Configura los datos de contacto y representante del proveedor.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* DATOS GENERALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Users className="w-4 h-4 text-slate-400" /> Información General
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Nombre del Proveedor <span className="text-red-500">*</span></Label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Ej: Distribuidora ABC SAC" 
                    className={getInputClass(formData.name)} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Representante
                  </Label>
                  <input 
                    name="representative" 
                    value={formData.representative} 
                    onChange={handleChange} 
                    placeholder="Ej: Juan Pérez" 
                    className={getInputClass(formData.representative)} 
                  />
                </div>
              </div>
            </div>

            {/* CONTACTO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Phone className="w-4 h-4 text-slate-400" /> Datos de Contacto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <input 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="contacto@proveedor.com" 
                    className={getInputClass(formData.email)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Teléfono
                  </Label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="Ej: 01 234 5678" 
                    className={getInputClass(formData.phone)} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Sitio Web
                </Label>
                <input 
                  name="website" 
                  type="url"
                  value={formData.website} 
                  onChange={handleChange} 
                  placeholder="https://www.proveedor.com" 
                  className={getInputClass(formData.website)} 
                />
              </div>
            </div>

            {/* NOTAS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Notas Adicionales
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Comentarios</Label>
                <textarea 
                  name="comments" 
                  value={formData.comments} 
                  onChange={handleChange} 
                  placeholder="Información adicional sobre el proveedor..." 
                  rows={3}
                  className={`${getInputClass(formData.comments)} h-auto resize-none`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                <Label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Proveedor Activo
                </Label>
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading} 
            className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="supplier-form" 
            disabled={isLoading} 
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {supplierToEdit ? 'Guardar Cambios' : 'Crear Proveedor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
