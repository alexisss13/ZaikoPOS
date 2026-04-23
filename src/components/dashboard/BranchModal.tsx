// src/app/(dashboard)/dashboard/branches/BranchModal.tsx
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loading02Icon, Store01Icon, PaintBoardIcon, Tag01Icon, Cancel01Icon, Camera01Icon, ArrowDown01Icon, Note01Icon } from 'hugeicons-react';
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
  logos: {
    isotipo?: string;
    isotipoWhite?: string;
    imagotipo?: string;
    imagotipoWhite?: string;
    alternate?: string;
  } | null;
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
  
  // Estados para los acordeones
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  
  const { data: businesses } = useSWR(currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', customRuc: '', customLegalName: '', customAddress: '', 
    logoIsotipo: '',
    logoIsotipoWhite: '',
    logoImagotipo: '',
    logoImagotipoWhite: '',
    logoAlternate: '',
    colorPrimary: '#0f172a', colorSecondary: '#3b82f6', colorOptional: '#ffffff', 
    businessId: 'NONE', ecommerceCode: ''
  });

  useEffect(() => {
    if (branchToEdit && isOpen) {
      const logos = branchToEdit.logos || {};
      setFormData({
        name: branchToEdit.name,
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        customRuc: branchToEdit.customRuc || '',
        customLegalName: branchToEdit.customLegalName || '',
        customAddress: branchToEdit.customAddress || '',
        logoIsotipo: logos.isotipo || '',
        logoIsotipoWhite: logos.isotipoWhite || '',
        logoImagotipo: logos.imagotipo || '',
        logoImagotipoWhite: logos.imagotipoWhite || '',
        logoAlternate: logos.alternate || '',
        colorPrimary: branchToEdit.brandColors?.primary || '#0f172a',
        colorSecondary: branchToEdit.brandColors?.secondary || '#3b82f6',
        colorOptional: branchToEdit.brandColors?.optional || '#ffffff',
        businessId: branchToEdit.businessId || 'NONE',
        ecommerceCode: branchToEdit.ecommerceCode || '',
      });
      if (branchToEdit.customRuc) setShowAdvanced(true);
      if (branchToEdit.logos || branchToEdit.brandColors) setShowBranding(true);
    } else if (isOpen) {
      setFormData({ 
        name: '', address: '', phone: '', customRuc: '', customLegalName: '', customAddress: '', 
        logoIsotipo: '', logoIsotipoWhite: '', logoImagotipo: '', logoImagotipoWhite: '', logoAlternate: '',
        colorPrimary: '#0f172a', colorSecondary: '#3b82f6', colorOptional: '#ffffff', 
        businessId: 'NONE', ecommerceCode: '',
      });
      setShowAdvanced(false);
      setShowBranding(false);
    }
  }, [branchToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: 'isotipo' | 'isotipoWhite' | 'imagotipo' | 'imagotipoWhite' | 'alternate') => {
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
        const fieldMap = {
          isotipo: 'logoIsotipo',
          isotipoWhite: 'logoIsotipoWhite',
          imagotipo: 'logoImagotipo',
          imagotipoWhite: 'logoImagotipoWhite',
          alternate: 'logoAlternate'
        };
        setFormData(prev => ({ ...prev, [fieldMap[logoType]]: data.secure_url }));
        toast.success(`${logoType} subido correctamente`);
      } else { throw new Error(data.error?.message || 'Error al subir'); }
    } catch (error) { toast.error('Error de conexión con Cloudinary'); } 
    finally { setIsUploadingImage(false); }
  };

  const removeImage = (logoType: 'isotipo' | 'isotipoWhite' | 'imagotipo' | 'imagotipoWhite' | 'alternate') => {
    const fieldMap = {
      isotipo: 'logoIsotipo',
      isotipoWhite: 'logoIsotipoWhite',
      imagotipo: 'logoImagotipo',
      imagotipoWhite: 'logoImagotipoWhite',
      alternate: 'logoAlternate'
    };
    setFormData(prev => ({ ...prev, [fieldMap[logoType]]: '' }));
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
        logos: {
          isotipo: formData.logoIsotipo.trim() === '' ? null : formData.logoIsotipo,
          isotipoWhite: formData.logoIsotipoWhite.trim() === '' ? null : formData.logoIsotipoWhite,
          imagotipo: formData.logoImagotipo.trim() === '' ? null : formData.logoImagotipo,
          imagotipoWhite: formData.logoImagotipoWhite.trim() === '' ? null : formData.logoImagotipoWhite,
          alternate: formData.logoAlternate.trim() === '' ? null : formData.logoAlternate,
        },
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
            <Store01Icon size={20} strokeWidth={2} className="text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Configura los datos, ubicación y la identidad visual de esta tienda.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="branch-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* DATOS GENERALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Store01Icon size={16} strokeWidth={2} className="text-slate-400" /> Información General
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Nombre de Tienda (Sede) <span className="text-red-500">*</span></Label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Festamas Chimbote" className={getInputClass(formData.name)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Teléfono Local</Label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 01 234 5678" className={getInputClass(formData.phone)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Dirección Comercial</Label>
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Av. Principal 123, Ciudad" className={getInputClass(formData.address)} />
              </div>
            </div>

            {/* SUPER ADMIN: ASIGNACIÓN */}
            {currentUserRole === 'SUPER_ADMIN' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                  <Tag01Icon size={16} strokeWidth={2} className="text-slate-400" /> Vínculo de Sistema
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Pertenece a la Empresa <span className="text-red-500">*</span></Label>
                    <Select value={formData.businessId} onValueChange={(v) => setFormData(p => ({...p, businessId: v}))} disabled={!!branchToEdit}>
                      <SelectTrigger className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.businessId !== 'NONE' ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                        <SelectValue placeholder="Seleccionar Negocio" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="NONE" disabled>Selecciona un cliente</SelectItem>
                        {businesses?.map((biz: SimpleBusiness) => (
                          <SelectItem key={biz.id} value={biz.id} className="py-2.5 px-3 font-medium text-slate-700">{biz.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">E-commerce (Catálogo)</Label>
                    <input 
                      name="ecommerceCode" 
                      value={formData.ecommerceCode} 
                      onChange={handleChange} 
                      placeholder="Auto-generado si se omite" 
                      className={`${getInputClass(formData.ecommerceCode)} font-mono tracking-wide`}
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Modifícalo si es una división específica (Ej: JUGUETES).</p>
                  </div>
                </div>
              </div>
            )}

            {/* BRANDING E IDENTIDAD VISUAL (ACORDEÓN FLAT) */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <button type="button" onClick={() => setShowBranding(!showBranding)} className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${showBranding ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide">
                  <PaintBoardIcon size={16} strokeWidth={2.5} className={`${showBranding ? 'text-slate-900' : 'text-slate-400'}`} /> Marca y Logo
                </div>
                <ArrowDown01Icon size={16} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${showBranding ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${showBranding ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-5 space-y-6">
                    
                    {/* Logos Upload - Grid de 5 tipos */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-700">Logos de la Sucursal</Label>
                      <p className="text-[10px] text-slate-400 font-medium mb-3">Sube diferentes versiones del logo para usar en distintos contextos.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Isotipo */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Isotipo</Label>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200 min-h-[80px]">
                            {formData.logoIsotipo ? (
                              <div className="w-full h-16 rounded-lg border border-slate-200 overflow-hidden bg-white relative group">
                                <img src={formData.logoIsotipo} alt="Isotipo" className="w-full h-full object-contain p-1" />
                                <button type="button" onClick={() => removeImage('isotipo')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Cancel01Icon size={16} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full h-16 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'isotipo')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Isotipo Blanco */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Isotipo Blanco</Label>
                          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 min-h-[80px]">
                            {formData.logoIsotipoWhite ? (
                              <div className="w-full h-16 rounded-lg border border-slate-700 overflow-hidden bg-slate-800 relative group">
                                <img src={formData.logoIsotipoWhite} alt="Isotipo Blanco" className="w-full h-full object-contain p-1" />
                                <button type="button" onClick={() => removeImage('isotipoWhite')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Cancel01Icon size={16} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full h-16 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'isotipoWhite')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Imagotipo */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Imagotipo</Label>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200 min-h-[80px]">
                            {formData.logoImagotipo ? (
                              <div className="w-full h-16 rounded-lg border border-slate-200 overflow-hidden bg-white relative group">
                                <img src={formData.logoImagotipo} alt="Imagotipo" className="w-full h-full object-contain p-1" />
                                <button type="button" onClick={() => removeImage('imagotipo')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Cancel01Icon size={16} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full h-16 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imagotipo')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Imagotipo Blanco */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Imagotipo Blanco</Label>
                          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 min-h-[80px]">
                            {formData.logoImagotipoWhite ? (
                              <div className="w-full h-16 rounded-lg border border-slate-700 overflow-hidden bg-slate-800 relative group">
                                <img src={formData.logoImagotipoWhite} alt="Imagotipo Blanco" className="w-full h-full object-contain p-1" />
                                <button type="button" onClick={() => removeImage('imagotipoWhite')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Cancel01Icon size={16} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full h-16 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imagotipoWhite')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Logo Alternativo */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold">Logo Alternativo</Label>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200 min-h-[80px]">
                            {formData.logoAlternate ? (
                              <div className="w-full h-16 rounded-lg border border-slate-200 overflow-hidden bg-white relative group">
                                <img src={formData.logoAlternate} alt="Alternativo" className="w-full h-full object-contain p-1" />
                                <button type="button" onClick={() => removeImage('alternate')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Cancel01Icon size={16} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full h-16 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'alternate')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 🚀 MEJORA: Selectores de Color Consolidados y Planos */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-slate-700">Colores Representativos</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Estos colores definirán la identidad visual del E-commerce y facturas.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* Color Principal */}
                        <div className="space-y-2">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Principal</Label>
                          <div className="flex items-center gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all shadow-sm">
                            <div 
                              className="relative w-8 h-8 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] shrink-0 border border-black/5"
                              style={{ backgroundColor: formData.colorPrimary }}
                            >
                              <input 
                                type="color" 
                                name="colorPrimary" 
                                value={formData.colorPrimary} 
                                onChange={handleChange} 
                                className="absolute [-webkit-appearance:none] [border:none] inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={formData.colorPrimary.toUpperCase()} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                                  setFormData(prev => ({ ...prev, colorPrimary: val }));
                                }
                              }}
                              onBlur={(e) => {
                                 if(e.target.value.length !== 7) setFormData(prev => ({...prev, colorPrimary: '#0f172a'}))
                              }}
                              placeholder="#0F172A"
                              className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono font-bold text-slate-700 w-full uppercase placeholder:text-slate-400"
                              maxLength={7}
                            />
                          </div>
                        </div>

                        {/* Color Secundario */}
                        <div className="space-y-2">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Secundario</Label>
                          <div className="flex items-center gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all shadow-sm">
                            <div 
                              className="relative w-8 h-8 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] shrink-0 border border-black/5"
                              style={{ backgroundColor: formData.colorSecondary }}
                            >
                              <input 
                                type="color" 
                                name="colorSecondary" 
                                value={formData.colorSecondary} 
                                onChange={handleChange} 
                                className="absolute [-webkit-appearance:none] [border:none] inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={formData.colorSecondary.toUpperCase()} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                                  setFormData(prev => ({ ...prev, colorSecondary: val }));
                                }
                              }}
                              onBlur={(e) => {
                                 if(e.target.value.length !== 7) setFormData(prev => ({...prev, colorSecondary: '#3b82f6'}))
                              }}
                              placeholder="#3B82F6"
                              className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono font-bold text-slate-700 w-full uppercase placeholder:text-slate-400"
                              maxLength={7}
                            />
                          </div>
                        </div>

                        {/* Color Opcional */}
                        <div className="space-y-2">
                          <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contraste (Opcional)</Label>
                          <div className="flex items-center gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all shadow-sm">
                            <div 
                              className="relative w-8 h-8 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] shrink-0 border border-black/10"
                              style={{ backgroundColor: formData.colorOptional }}
                            >
                              <input 
                                type="color" 
                                name="colorOptional" 
                                value={formData.colorOptional} 
                                onChange={handleChange} 
                                className="absolute [-webkit-appearance:none] [border:none] inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={formData.colorOptional.toUpperCase()} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                                  setFormData(prev => ({ ...prev, colorOptional: val }));
                                }
                              }}
                              onBlur={(e) => {
                                 if(e.target.value.length !== 7) setFormData(prev => ({...prev, colorOptional: '#ffffff'}))
                              }}
                              placeholder="#FFFFFF"
                              className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono font-bold text-slate-700 w-full uppercase placeholder:text-slate-400"
                              maxLength={7}
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* CONFIGURACIÓN DE RUC INDEPENDIENTE (ACORDEÓN FLAT) */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${showAdvanced ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide">
                  <Note01Icon size={16} strokeWidth={2.5} className={`${showAdvanced ? 'text-slate-900' : 'text-slate-400'}`} /> RUC Independiente / Facturación
                </div>
                <ArrowDown01Icon size={16} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${showAdvanced ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-5 space-y-4 bg-slate-50/30">
                    <p className="text-xs text-slate-500 font-medium">Llena estos campos SOLO si esta sucursal emitirá boletas/facturas con un RUC distinto a la sede principal (Franquicias).</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">RUC Independiente</Label><input name="customRuc" value={formData.customRuc} onChange={handleChange} placeholder="Ej: 10123456789" className={getInputClass(formData.customRuc)} /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Razón Social</Label><input name="customLegalName" value={formData.customLegalName} onChange={handleChange} placeholder="Ej: Juan Pérez EIRL" className={getInputClass(formData.customLegalName)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Dirección Fiscal</Label><input name="customAddress" value={formData.customAddress} onChange={handleChange} placeholder="Si es distinta a la dirección comercial" className={getInputClass(formData.customAddress)} /></div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* 🚀 FOOTER PLANO */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200">
            Cancelar
          </Button>
          <Button type="submit" form="branch-form" disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all">
            {isLoading && <Loading02Icon size={14} strokeWidth={2} className="mr-1.5 animate-spin" />}
            {branchToEdit ? 'Guardar Cambios' : 'Crear Sucursal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}