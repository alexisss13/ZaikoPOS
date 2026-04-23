'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loading02Icon, SecurityCheckIcon, PackageOpenIcon, Tag01Icon, Shield01Icon, 
  Search01Icon, InformationCircleIcon, ArrowDown01Icon, EyeIcon, FloppyDiskIcon, Cancel01Icon, Alert01Icon
} from 'hugeicons-react';
import { 
  BasicUserData, 
  PermissionConfig, 
  DEFAULT_PERMISSIONS, 
  PERMISSION_CATEGORIES
} from './types/user-management.types';
import { usePermissionsManager } from './hooks/usePermissionsManager';

interface PermissionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit: BasicUserData & { permissions?: Record<string, boolean> };
}

type AccordionSection = 'inventory' | 'pos' | 'privacy' | null;

export function PermissionsManager({ isOpen, onClose, onSuccess, userToEdit }: PermissionsManagerProps) {
  const [openSection, setOpenSection] = useState<AccordionSection>('inventory');
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    permissions,
    originalPermissions,
    searchTerm,
    setSearchTerm,
    expandedInfo,
    isLoading,
    setIsLoading,
    handlePermissionToggle,
    toggleInfo,
    resetToRoleDefaults,
    getChanges,
    hasChanges,
    preparePayload,
    validatePermissions
  } = usePermissionsManager({ userToEdit, isOpen });

  const toggleSection = (section: AccordionSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Filter permissions based on search term
  const filteredPermissions = DEFAULT_PERMISSIONS.filter(permission =>
    permission.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, PermissionConfig[]>);

  // Get changes for preview
  const changes = getChanges();

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info('No hay cambios para guardar');
      return;
    }

    // Validate permissions
    const validationError = validatePermissions();
    if (validationError) {
      const confirmDangerous = confirm(validationError + ' ¿Continuar?');
      if (!confirmDangerous) return;
    }

    setIsLoading(true);
    try {
      const payload = preparePayload();

      const res = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Permisos actualizados correctamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    const rolePermissions = resetToRoleDefaults();
    toast.info(`Permisos restablecidos a los valores por defecto del rol ${userToEdit.role}`);
  };

  const PermissionRow = ({ permission }: { permission: PermissionConfig }) => {
    const { key, label, description, type = 'default' } = permission;
    const textColors = { 
      default: 'text-slate-800', 
      warning: 'text-amber-600', 
      critical: 'text-red-600' 
    };
    const isExpanded = expandedInfo[key];
    const isEnabled = permissions[key] || false;
    const hasChanged = (originalPermissions[key] || false) !== isEnabled;

    return (
      <div className={`flex flex-col border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${hasChanged ? 'bg-blue-50/30 border-blue-200' : ''}`}>
        <div className="flex items-center justify-between p-3 sm:px-4 sm:py-3.5">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={(e) => toggleInfo(key, e)}
              className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              title="Ver más información"
            >
              <InformationCircleIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <div className="flex-1">
              <Label className={`text-xs sm:text-sm font-semibold cursor-pointer ${textColors[type]} flex items-center gap-2 leading-tight`}>
                {label}
                {hasChanged && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Modificado" />
                )}
                {type === 'critical' && (
                  <Alert01Icon className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                )}
              </Label>
            </div>
          </div>
          <Switch 
            checked={isEnabled} 
            onCheckedChange={() => handlePermissionToggle(key)}
            className={hasChanged ? 'data-[state=checked]:bg-blue-600' : ''}
          />
        </div>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-3' : 'grid-rows-[0fr] opacity-0 pb-0'}`}>
          <div className="overflow-hidden px-4 sm:px-12">
            <p className="text-[10px] sm:text-xs text-slate-500 leading-snug">{description}</p>
          </div>
        </div>
      </div>
    );
  };

  const CategorySection = ({ category, permissions: categoryPermissions }: { 
    category: keyof typeof PERMISSION_CATEGORIES; 
    permissions: PermissionConfig[] 
  }) => {
    const icons = {
      inventory: PackageOpenIcon,
      pos: Tag01Icon,
      privacy: Shield01Icon
    };
    const Icon = icons[category];
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        <button 
          type="button" 
          onClick={() => toggleSection(category)} 
          className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${openSection === category ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide">
            <Icon className={`w-4 h-4 ${openSection === category ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={2.5} />
            {PERMISSION_CATEGORIES[category]}
          </div>
          <ArrowDown01Icon className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openSection === category ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${openSection === category ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            {categoryPermissions.map((permission) => (
              <PermissionRow key={permission.key} permission={permission} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PreviewModal = () => {
    const changesWithLabels = changes.map(change => {
      const permission = DEFAULT_PERMISSIONS.find(p => p.key === change.key);
      return {
        ...change,
        label: permission?.label || change.key
      };
    });
    
    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5" strokeWidth={1.5} />
              Vista Previa de Cambios
            </DialogTitle>
            <DialogDescription>
              Revisa los cambios antes de aplicarlos a {userToEdit.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {changesWithLabels.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay cambios para mostrar</p>
            ) : (
              changesWithLabels.map((change) => (
                <div key={change.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{change.label}</p>
                    <p className="text-xs text-slate-500">
                      {change.from ? 'Habilitado' : 'Deshabilitado'} → {change.to ? 'Habilitado' : 'Deshabilitado'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${change.to ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {change.to ? 'ON' : 'OFF'}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { setShowPreview(false); handleSubmit(); }} disabled={changesWithLabels.length === 0}>
              Aplicar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] sm:max-w-4xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
              <SecurityCheckIcon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-start text-left flex-1">
              <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
                Gestión de Permisos
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
                Configuración granular de permisos para {userToEdit.name} ({userToEdit.role})
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
            
            {/* Search and Controls */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <Input
                  placeholder="Buscar permisos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                  className="text-xs"
                >
                  Restablecer a {userToEdit.role}
                </Button>
                
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                  <EyeIcon className="w-3 h-3 mr-1" strokeWidth={1.5} />
                    Vista Previa ({changes.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Permissions Categories */}
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <CategorySection
                  key={category}
                  category={category as keyof typeof PERMISSION_CATEGORIES}
                  permissions={categoryPermissions}
                />
              ))}
              
              {filteredPermissions.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <Search01Icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No se encontraron permisos</p>
                  <p className="text-xs text-slate-400 mt-1">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>

            {/* Super Admin Notice */}
            {userToEdit.role === 'SUPER_ADMIN' && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Alert01Icon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">Privilegios Absolutos</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Los usuarios con rol SUPER_ADMIN tienen acceso irrestricto a toda la plataforma. 
                      Los permisos granulares no aplican para este rol.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="text-xs text-slate-500">
              {hasChanges ? (
                <span className="text-blue-600 font-medium">
                  {changes.length} cambio{changes.length !== 1 ? 's' : ''} pendiente{changes.length !== 1 ? 's' : ''}
                </span>
              ) : (
                'Sin cambios'
              )}
            </div>
            
            <div className="flex gap-3">
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
                onClick={handleSubmit} 
                disabled={isLoading || !hasChanges}
                className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-md rounded-xl transition-all"
              >
                {isLoading && <Loading02Icon className="w-4 h-4 animate-spin mr-2" />}
                <FloppyDiskIcon className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PreviewModal />
    </>
  );
}

export { PermissionsManager as default };