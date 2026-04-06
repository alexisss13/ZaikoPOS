'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Users, Store, ReceiptText, ChevronDown } from 'lucide-react';

export interface BusinessData {
  id?: string;
  name: string;
  ruc?: string;
  address?: string;
  maxBranches: number;
  maxManagers: number;
  maxEmployees: number;
}

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessToEdit?: BusinessData | null; 
}

export function BusinessModal({ isOpen, onClose, onSuccess, businessToEdit }: BusinessModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOwnerSection, setShowOwnerSection] = useState(false);
  
  const [formData, setFormData] = useState({
    workspaceName: '',
    ruc: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    maxBranches: 1,
    maxManagers: 1,
    maxEmployees: 3,
  });

  useEffect(() => {
    if (businessToEdit && isOpen) {
      setFormData({
        workspaceName: businessToEdit.name,
        ruc: businessToEdit.ruc || '',
        address: businessToEdit.address || '',
        ownerName: '********',
        ownerEmail: '********',
        ownerPassword: '',
        maxBranches: businessToEdit.maxBranches,
        maxManagers: businessToEdit.maxManagers,
        maxEmployees: businessToEdit.maxEmployees,
      });
      setShowOwnerSection(false);
    } else if (isOpen) {
      setFormData({ 
        workspaceName: '', 
        ruc: '', 
        address: '', 
        ownerName: '', 
        ownerEmail: '', 
        ownerPassword: '', 
        maxBranches: 1, 
        maxManagers: 1, 
        maxEmployees: 3 
      });
      setShowOwnerSection(true);
    }
  }, [businessToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (businessToEdit?.id) {
        const res = await fetch(`/api/businesses/${businessToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) throw new Error('Error al actualizar');
        toast.success('Negocio actualizado correctamente');
      } else {
        const res = await fetch('/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar');
        toast.success('Cliente registrado y credenciales creadas');
      }

      onSuccess(); 
      onClose(); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Hubo un problema';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (val: string | number | undefined) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-sm w-full rounded-xl border px-3 h-10 outline-none";
    const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
    const state = hasValue
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER PLANO */}
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {businessToEdit ? 'Editar Negocio' : 'Registrar Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              {businessToEdit 
                ? 'Actualiza la información y límites de licencia del negocio.' 
                : 'Crea un nuevo espacio de trabajo con credenciales de acceso.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="business-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* INFORMACIÓN GENERAL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Building2 className="w-4 h-4 text-slate-400" /> Información del Negocio
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Nombre del Negocio (Empresa / Marca) <span className="text-red-500">*</span></Label>
                  <input 
                    name="workspaceName" 
                    value={formData.workspaceName} 
                    onChange={handleChange} 
                    placeholder="Ej: Festamas Perú" 
                    className={getInputClass(formData.workspaceName)} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">RUC {businessToEdit && <span className="text-xs text-slate-400 font-normal">(Editable)</span>}</Label>
                    <input 
                      name="ruc" 
                      value={formData.ruc} 
                      onChange={handleChange} 
                      placeholder="Ej: 20123456789" 
                      className={getInputClass(formData.ruc)}
                      maxLength={11}
                    />
                    {!businessToEdit && <p className="text-[10px] text-slate-400 font-medium">Se generará automáticamente si se omite.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Dirección Fiscal</Label>
                    <input 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange} 
                      placeholder="Av. Principal 123, Ciudad" 
                      className={getInputClass(formData.address)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CREDENCIALES DEL DUEÑO (Solo al crear) */}
            {!businessToEdit && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <button 
                  type="button" 
                  onClick={() => setShowOwnerSection(!showOwnerSection)} 
                  className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${showOwnerSection ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide">
                    <Users className={`w-4 h-4 ${showOwnerSection ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={2.5} /> Credenciales del Dueño
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showOwnerSection ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`grid transition-all duration-300 ease-in-out ${showOwnerSection ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-5 space-y-4 bg-slate-50/30">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Nombre Completo del Dueño <span className="text-red-500">*</span></Label>
                        <input 
                          name="ownerName" 
                          value={formData.ownerName} 
                          onChange={handleChange} 
                          placeholder="Ej: Juan Pérez García" 
                          className={getInputClass(formData.ownerName)} 
                          required={!businessToEdit}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Correo de Acceso <span className="text-red-500">*</span></Label>
                          <input 
                            type="email" 
                            name="ownerEmail" 
                            value={formData.ownerEmail} 
                            onChange={handleChange} 
                            placeholder="correo@empresa.com" 
                            className={getInputClass(formData.ownerEmail)} 
                            required={!businessToEdit}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Contraseña Inicial <span className="text-red-500">*</span></Label>
                          <input 
                            type="password" 
                            name="ownerPassword" 
                            value={formData.ownerPassword} 
                            onChange={handleChange} 
                            placeholder="Mínimo 6 caracteres" 
                            className={getInputClass(formData.ownerPassword)} 
                            required={!businessToEdit}
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LÍMITES DE LICENCIA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Store className="w-4 h-4 text-slate-400" /> Límites de Licencia SaaS
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Máximo de Sucursales <span className="text-red-500">*</span></Label>
                  <input 
                    type="number" 
                    name="maxBranches" 
                    min={1} 
                    value={formData.maxBranches} 
                    onChange={handleChange} 
                    className={getInputClass(formData.maxBranches)} 
                    required 
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Tiendas físicas permitidas</p>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Jefes por Sucursal <span className="text-red-500">*</span></Label>
                  <input 
                    type="number" 
                    name="maxManagers" 
                    min={1} 
                    value={formData.maxManagers} 
                    onChange={handleChange} 
                    className={getInputClass(formData.maxManagers)} 
                    required 
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Gerentes/Supervisores</p>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Cajeros por Sucursal <span className="text-red-500">*</span></Label>
                  <input 
                    type="number" 
                    name="maxEmployees" 
                    min={1} 
                    value={formData.maxEmployees} 
                    onChange={handleChange} 
                    className={getInputClass(formData.maxEmployees)} 
                    required 
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Vendedores/Empleados</p>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER PLANO */}
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
            form="business-form" 
            disabled={isLoading} 
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {businessToEdit ? 'Guardar Cambios' : 'Crear Negocio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}