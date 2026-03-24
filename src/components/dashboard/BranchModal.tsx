'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Store, ReceiptText, Palette, Tags } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface BranchData {
  id?: string;
  name: string;
  address: string | null;
  phone: string | null;
  customRuc: string | null;
  customLegalName: string | null;
  customAddress: string | null;
  logoUrl: string | null;
  brandColors: { primary?: string; secondary?: string; optional?: string } | null;
  businessId?: string;
  ecommerceCode?: string | null;
}

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchToEdit?: BranchData | null;
}

interface SimpleBusiness {
  id: string;
  name: string;
}

export function BranchModal({ isOpen, onClose, onSuccess, branchToEdit }: BranchModalProps) {
  const { role: currentUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false); 
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  
  const { data: businesses } = useSWR(currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', customRuc: '', customLegalName: '', customAddress: '', 
    logoUrl: '', colorPrimary: '#0f172a', colorSecondary: '#3b82f6', colorOptional: '#ffffff', 
    businessId: 'NONE', ecommerceCode: ''
  });

  useEffect(() => {
    if (branchToEdit && isOpen) {
      setFormData({
        name: branchToEdit.name,
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        customRuc: branchToEdit.customRuc || '',
        customLegalName: branchToEdit.customLegalName || '',
        customAddress: branchToEdit.customAddress || '',
        logoUrl: branchToEdit.logoUrl || '',
        colorPrimary: branchToEdit.brandColors?.primary || '#0f172a',
        colorSecondary: branchToEdit.brandColors?.secondary || '#3b82f6',
        colorOptional: branchToEdit.brandColors?.optional || '#ffffff',
        businessId: branchToEdit.businessId || 'NONE',
        ecommerceCode: branchToEdit.ecommerceCode || '',
      });
      if (branchToEdit.customRuc) setShowAdvanced(true);
      if (branchToEdit.logoUrl || branchToEdit.brandColors) setShowBranding(true);
    } else if (isOpen) {
      setFormData({ 
        name: '', address: '', phone: '', customRuc: '', customLegalName: '', customAddress: '', 
        logoUrl: '', colorPrimary: '#0f172a', colorSecondary: '#3b82f6', colorOptional: '#ffffff', 
        businessId: 'NONE', ecommerceCode: '',
      });
      setShowAdvanced(false);
      setShowBranding(false);
    }
  }, [branchToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos'); 
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', {
        method: 'POST', body: uploadData,
      });
      
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, logoUrl: data.secure_url }));
        toast.success('Logo subido correctamente');
      } else { throw new Error(data.error?.message || 'Error al subir'); }
    } catch (error) { toast.error('Error de conexión con Cloudinary'); } 
    finally { setIsUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUserRole === 'SUPER_ADMIN' && (!formData.businessId || formData.businessId === 'NONE')) {
      toast.error('Debes seleccionar el negocio al que pertenece la sucursal.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        businessId: formData.businessId === 'NONE' ? undefined : formData.businessId,
        customRuc: formData.customRuc.trim() === '' ? null : formData.customRuc,
        customLegalName: formData.customLegalName.trim() === '' ? null : formData.customLegalName,
        customAddress: formData.customAddress.trim() === '' ? null : formData.customAddress,
        logoUrl: formData.logoUrl.trim() === '' ? null : formData.logoUrl,
        brandColors: {
          primary: formData.colorPrimary,
          secondary: formData.colorSecondary,
          optional: formData.colorOptional
        },
        ecommerceCode: formData.ecommerceCode.trim() === '' ? null : formData.ecommerceCode
      };

      const url = branchToEdit?.id ? `/api/branches/${branchToEdit.id}` : '/api/branches';
      const method = branchToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(branchToEdit?.id ? 'Sucursal actualizada correctamente' : 'Sucursal creada exitosamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Store className="w-5 h-5 text-primary" />
            {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </DialogTitle>
          <DialogDescription>
            Configura los datos y la identidad visual de esta tienda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de Tienda (Sede)</Label>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Festamas Chimbote" required />
            </div>
            <div className="space-y-2">
              <Label>Teléfono Local</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 01 234 5678" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección Comercial</Label>
            <Input name="address" value={formData.address} onChange={handleChange} placeholder="Av. Larco 123, Lima" />
          </div>

          {currentUserRole === 'SUPER_ADMIN' && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2 pt-2">
                <Label>Pertenece a la Empresa:</Label>
                <Select value={formData.businessId} onValueChange={(v) => setFormData(p => ({...p, businessId: v}))} disabled={!!branchToEdit}>
                  <SelectTrigger className="border-blue-200 bg-blue-50">
                    <SelectValue placeholder="Seleccionar Negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" disabled>Selecciona un cliente</SelectItem>
                    {businesses?.map((biz: SimpleBusiness) => (
                      <SelectItem key={biz.id} value={biz.id}>{biz.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 🚀 EL PUENTE E-COMMERCE (SOLO VISIBLE PARA TI) */}
              <div className="space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <Label className="flex items-center gap-2 text-purple-700">
                  <Tags className="w-4 h-4" /> Vínculo E-commerce (División)
                </Label>
                <Input 
                  name="ecommerceCode" 
                  value={formData.ecommerceCode} 
                  onChange={handleChange} 
                  placeholder="Dejar en blanco para autogenerar..." 
                  className="uppercase font-mono bg-white"
                />
                <p className="text-[10px] text-purple-600">
                  Si se deja en blanco, tomará el nombre de la tienda. Modifícalo solo si quieres apuntar a una división específica del catálogo (Ej: JUGUETERIA).
                </p>
              </div>
            </div>
          )}

          {/* BRANDING */}
          <div className="pt-2 border-t">
            <button type="button" onClick={() => setShowBranding(!showBranding)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              <Palette className="w-4 h-4" /> {showBranding ? 'Ocultar Diseño' : 'Personalizar Marca / Logo'}
            </button>
            
            {showBranding && (
              <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-5 animate-in fade-in slide-in-from-top-2">
                
                {/* 🚀 UPLOAD DE LOGO */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700">Logo de la Sucursal</Label>
                  <div className="flex items-center gap-4">
                    {formData.logoUrl ? (
                      <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm">
                        <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:font-medium file:cursor-pointer cursor-pointer text-xs h-10" />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md border text-xs font-bold text-indigo-600 gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-indigo-100/50">
                  <Label className="text-xs font-bold text-slate-700">Colores Representativos</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1"><div className="w-full h-10 rounded overflow-hidden border border-slate-200 shadow-sm"><input type="color" name="colorPrimary" value={formData.colorPrimary} onChange={handleChange} className="w-full h-14 -mt-2 cursor-pointer" /></div><span className="text-[10px] text-slate-500 uppercase font-bold">Principal</span></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-full h-10 rounded overflow-hidden border border-slate-200 shadow-sm"><input type="color" name="colorSecondary" value={formData.colorSecondary} onChange={handleChange} className="w-full h-14 -mt-2 cursor-pointer" /></div><span className="text-[10px] text-slate-500 uppercase font-bold">Secundario</span></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-full h-10 rounded overflow-hidden border border-slate-200 bg-white shadow-sm"><input type="color" name="colorOptional" value={formData.colorOptional} onChange={handleChange} className="w-full h-14 -mt-2 cursor-pointer" /></div><span className="text-[10px] text-slate-500 uppercase font-bold">Opcional</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              <ReceiptText className="w-4 h-4" /> {showAdvanced ? 'Ocultar Datos de Facturación' : 'Configurar RUC Independiente'}
            </button>
            {showAdvanced && (
              <div className="mt-4 p-4 bg-slate-50 border rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-slate-500">Llena estos campos SOLO si esta sucursal emitirá boletas/facturas con un RUC distinto.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs">RUC Independiente</Label><Input name="customRuc" value={formData.customRuc} onChange={handleChange} placeholder="Ej: 10123456789" /></div>
                  <div className="space-y-2"><Label className="text-xs">Razón Social</Label><Input name="customLegalName" value={formData.customLegalName} onChange={handleChange} placeholder="Ej: Juan Pérez EIRL" /></div>
                </div>
                <div className="space-y-2"><Label className="text-xs">Dirección Fiscal</Label><Input name="customAddress" value={formData.customAddress} onChange={handleChange} placeholder="Si es distinta a la dirección comercial" /></div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {branchToEdit ? 'Guardar Cambios' : 'Crear Sucursal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}