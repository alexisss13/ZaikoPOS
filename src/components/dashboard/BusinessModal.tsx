'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

export interface BusinessData {
  id?: string;
  name: string; 
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
  
  const [formData, setFormData] = useState({
    workspaceName: '',
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
        ownerName: '********',
        ownerEmail: '********',
        ownerPassword: '',
        maxBranches: businessToEdit.maxBranches,
        maxManagers: businessToEdit.maxManagers,
        maxEmployees: businessToEdit.maxEmployees,
      });
    } else if (isOpen) {
      setFormData({ workspaceName: '', ownerName: '', ownerEmail: '', ownerPassword: '', maxBranches: 1, maxManagers: 1, maxEmployees: 3 });
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
      // 🚀 SI ESTAMOS EDITANDO: Llamamos al PUT
      if (businessToEdit?.id) {
        const res = await fetch(`/api/businesses/${businessToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) throw new Error('Error al actualizar límites');
        toast.success('Licencia actualizada correctamente');
      } 
      // 🚀 SI ES NUEVO: Llamamos al POST
      else {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-primary" />
            {businessToEdit ? 'Actualizar Licencia' : 'Registrar Nuevo Dueño'}
          </DialogTitle>
          <DialogDescription>
            {businessToEdit 
              ? 'Modifica los límites de uso del SaaS para este cliente.' 
              : 'Crea un espacio de trabajo y las credenciales de acceso para el dueño.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del Espacio (Empresa / Marca)</Label>
            <Input name="workspaceName" value={formData.workspaceName} onChange={handleChange} required />
          </div>

          {!businessToEdit && (
            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <h4 className="text-sm font-bold text-slate-700 uppercase">Credenciales del Dueño</h4>
              <div className="space-y-2">
                <Label>Nombre del Dueño</Label>
                <Input name="ownerName" value={formData.ownerName} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Correo de Acceso</Label>
                  <Input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña Inicial</Label>
                  <Input type="password" name="ownerPassword" value={formData.ownerPassword} onChange={handleChange} required minLength={6} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Máx. Sucursales</Label>
              <Input type="number" name="maxBranches" min={1} value={formData.maxBranches} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Jefes / Sucursal</Label>
              <Input type="number" name="maxManagers" min={1} value={formData.maxManagers} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Cajeros / Sucursal</Label>
              <Input type="number" name="maxEmployees" min={1} value={formData.maxEmployees} onChange={handleChange} required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {businessToEdit ? 'Actualizar Límites' : 'Generar Licencia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}