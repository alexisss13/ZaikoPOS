'use client';

import { useState } from 'react';
import { 
  Store01Icon, 
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Building02Icon,
  PackageIcon,
  ShoppingCart01Icon,
  ChartLineData03Icon,
  UserGroupIcon,
  DollarCircleIcon,
  SparklesIcon,
  MapPinIcon,
  Call02Icon,
  Loading02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useResponsive } from '@/hooks/useResponsive';
import { toast } from 'sonner';

interface FirstBranchOnboardingProps {
  userName: string;
  businessName?: string;
  onBranchCreated?: () => void;
}

export function FirstBranchOnboarding({ userName, businessName, onBranchCreated }: FirstBranchOnboardingProps) {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form data para la sucursal
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const steps = [
    {
      icon: Building02Icon,
      title: 'Bienvenido a tu POS',
      subtitle: `Hola ${userName.split(' ')[0]}`,
      description: 'Estás a punto de comenzar tu experiencia con el sistema de punto de venta más completo.',
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      icon: Store01Icon,
      title: 'Crea tu sucursal',
      subtitle: 'Primer paso importante',
      description: 'Necesitas crear al menos una sucursal para comenzar. Esta será tu ubicación principal de operaciones.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50'
    },
    {
      icon: SparklesIcon,
      title: 'Todo listo para empezar',
      subtitle: 'Funcionalidades disponibles',
      description: 'Una vez creada tu sucursal, tendrás acceso completo a todas las herramientas del sistema.',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: Store01Icon,
      title: 'Configura tu sucursal',
      subtitle: 'Datos de tu tienda',
      description: 'Completa la información básica de tu primera sucursal.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50'
    }
  ];

  const features = [
    { icon: PackageIcon, text: 'Gestión de productos y variantes', color: 'blue' },
    { icon: ChartLineData03Icon, text: 'Control de inventario en tiempo real', color: 'emerald' },
    { icon: ShoppingCart01Icon, text: 'Punto de venta rápido y eficiente', color: 'purple' },
    { icon: DollarCircleIcon, text: 'Reportes y análisis de ventas', color: 'orange' },
    { icon: UserGroupIcon, text: 'Administración de personal', color: 'pink' }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleCreateBranch = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la sucursal es obligatorio');
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('¡Sucursal creada exitosamente!');
      
      // Esperar un momento y redirigir al dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear sucursal';
      toast.error(errorMessage);
      setIsCreating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getInputClass = (val: string) => {
    const base = "transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 font-medium text-sm w-full rounded-xl border px-4 h-12 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-white border-emerald-200 text-slate-900 shadow-sm" 
      : "bg-white border-slate-200 text-slate-700 focus:border-emerald-300";
    return `${base} ${state}`;
  };

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;
  const isLastStep = step === steps.length - 1;

  // Vista Móvil - Estilo App Nativa Mejorado
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 bg-slate-50 z-50 flex flex-col"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
      >
        {/* Header con Progress Dots */}
        <div className="px-6 pt-8 pb-4 bg-white border-b border-slate-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`transition-all duration-300 rounded-full ${
                  index === step 
                    ? 'w-8 h-2 bg-slate-900' 
                    : index < step
                    ? 'w-2 h-2 bg-slate-400 cursor-pointer hover:bg-slate-500'
                    : 'w-2 h-2 bg-slate-200'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 font-medium">
            {step + 1} de {steps.length}
          </p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {/* Icon Circle con animación */}
          <div className="flex justify-center mb-6">
            <div 
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center shadow-lg transform transition-all duration-500`}
              style={{
                animation: 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}
            >
              <StepIcon className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-center text-sm font-bold text-slate-500 mb-2">
            {currentStep.subtitle}
          </p>

          {/* Title */}
          <h1 className="text-3xl font-black text-slate-900 text-center mb-4 leading-tight">
            {currentStep.title}
          </h1>

          {/* Description */}
          <p className="text-base text-slate-600 text-center mb-8 leading-relaxed px-4">
            {currentStep.description}
          </p>

          {/* Business Info Card - Paso 0 */}
          {businessName && step === 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 mb-6 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Building02Icon className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Tu negocio</p>
                  <p className="text-base font-black text-slate-900">{businessName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Features List - Paso 2 */}
          {step === 2 && (
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                    style={{
                      animation: `slide-in-left 0.4s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${feature.color}-100 flex items-center justify-center shrink-0`}>
                      <FeatureIcon className={`w-5 h-5 text-${feature.color}-600`} strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 leading-snug">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info adicional para paso 1 */}
          {step === 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <SparklesIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">¿Por qué es importante?</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    La sucursal es el centro de todas tus operaciones. Aquí se gestionarán ventas, inventario y personal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FORMULARIO - Paso 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Store01Icon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  Nombre de la Sucursal <span className="text-red-500">*</span>
                </Label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Tienda Principal"
                  className={getInputClass(formData.name)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-slate-500" strokeWidth={2} />
                  Dirección
                </Label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Av. Principal 123, Ciudad"
                  className={getInputClass(formData.address)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Call02Icon className="w-4 h-4 text-slate-500" strokeWidth={2} />
                  Teléfono
                </Label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01 234 5678"
                  className={getInputClass(formData.phone)}
                  disabled={isCreating}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-6">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">Nota:</span> Podrás agregar más detalles como logos y colores de marca desde el panel de administración después.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 space-y-3">
          {/* Botón principal */}
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all bg-slate-900 text-white"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              Siguiente
              <ArrowRight01Icon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCreateBranch}
              disabled={isCreating || !formData.name.trim()}
              className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              {isCreating ? (
                <>
                  <Loading02Icon className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckmarkCircle01Icon className="w-5 h-5" />
                  Crear Sucursal
                </>
              )}
            </button>
          )}

          {/* Botón secundario */}
          {step > 0 && (
            <button
              onClick={handlePrev}
              disabled={isCreating}
              className="w-full h-12 rounded-xl font-semibold text-sm text-slate-600 active:bg-slate-100 transition-colors disabled:opacity-50"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowLeft01Icon className="w-4 h-4" />
                Anterior
              </div>
            </button>
          )}
        </div>

        <style jsx>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes slide-in-left {
            from {
              transform: translateX(-20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  // Vista Desktop - Rediseño Compacto y Profesional
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl h-[85vh] max-h-[700px] bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        
        {/* Sidebar Izquierdo - Progress */}
        <div className="w-64 bg-slate-900 p-8 flex flex-col">
          {/* Logo/Header */}
          <div className="mb-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <Store01Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-white font-black text-lg">Configuración Inicial</h2>
            <p className="text-white/60 text-sm mt-1">Paso {step + 1} de {steps.length}</p>
          </div>

          {/* Steps */}
          <div className="flex-1 space-y-6">
            {steps.map((s, index) => {
              const StepIconSmall = s.icon;
              const isActive = index === step;
              const isCompleted = index < step;
              
              return (
                <button
                  key={index}
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step || isCreating}
                  className={`w-full text-left transition-all group ${
                    isActive ? 'scale-105' : index <= step ? 'hover:scale-102 cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-lg' 
                        : isCompleted
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-white/40 group-hover:bg-white/15'
                    }`}>
                      {isCompleted ? (
                        <CheckmarkCircle01Icon className="w-5 h-5" strokeWidth={2.5} />
                      ) : (
                        <StepIconSmall className="w-5 h-5" strokeWidth={2.5} />
                      )}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 pt-1">
                      <p className={`text-sm font-bold transition-colors ${
                        isActive 
                          ? 'text-white' 
                          : isCompleted
                          ? 'text-white/80'
                          : 'text-white/40 group-hover:text-white/60'
                      }`}>
                        {s.subtitle}
                      </p>
                      {isActive && (
                        <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Line */}
                  {index < steps.length - 1 && (
                    <div className="ml-5 mt-3 mb-0 h-8 w-0.5 bg-white/10">
                      {isCompleted && (
                        <div className="w-full h-full bg-white/40 transition-all duration-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-10 py-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentStep.gradient} flex items-center justify-center shadow-lg`}>
                <StepIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{currentStep.title}</h1>
                <p className="text-sm text-slate-600">{currentStep.description}</p>
              </div>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {/* Paso 1 - Bienvenida */}
            {step === 0 && (
              <div className="space-y-6">
                {businessName && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Building02Icon className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Tu negocio</p>
                        <p className="text-xl font-black text-slate-900">{businessName}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Comencemos tu experiencia</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Bienvenido a tu nuevo sistema de punto de venta. En los siguientes pasos te guiaremos 
                    para configurar tu primera sucursal y comenzar a operar.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <PackageIcon className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Productos</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <ChartLineData03Icon className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Inventario</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <ShoppingCart01Icon className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Ventas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2 - Crear Sucursal */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <SparklesIcon className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-900 mb-2">¿Por qué necesitas una sucursal?</p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        La sucursal es el núcleo de tu operación. Desde aquí gestionarás todo: ventas, inventario, 
                        personal y reportes. Es el primer paso esencial para comenzar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Información que necesitarás</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckmarkCircle01Icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Nombre de la sucursal (ej: Sucursal Principal, Tienda Centro)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckmarkCircle01Icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Dirección física de la ubicación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckmarkCircle01Icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>Teléfono de contacto (opcional)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Paso 3 - Funcionalidades */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Todo listo para comenzar</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Una vez creada tu sucursal, tendrás acceso inmediato a todas estas funcionalidades:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {features.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-${feature.color}-100 flex items-center justify-center shrink-0`}>
                          <FeatureIcon className={`w-5 h-5 text-${feature.color}-600`} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <CheckmarkCircle01Icon className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-emerald-900">
                      Podrás agregar más sucursales en cualquier momento desde el panel de administración
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4 - FORMULARIO */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Store01Icon className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div>
                      <p className="text-sm font-black text-emerald-900 mb-1">Completa los datos básicos</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Solo necesitamos el nombre de tu sucursal para comenzar. Los demás campos son opcionales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Store01Icon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                      Nombre de la Sucursal <span className="text-red-500">*</span>
                    </Label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ej: Tienda Principal, Sucursal Centro"
                      className={getInputClass(formData.name)}
                      disabled={isCreating}
                      autoFocus
                    />
                    <p className="text-xs text-slate-500">Este nombre identificará tu sucursal en el sistema</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-slate-500" strokeWidth={2} />
                      Dirección
                    </Label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Av. Principal 123, Ciudad"
                      className={getInputClass(formData.address)}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-slate-500">Dirección física donde se encuentra tu tienda</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Call02Icon className="w-4 h-4 text-slate-500" strokeWidth={2} />
                      Teléfono
                    </Label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01 234 5678"
                      className={getInputClass(formData.phone)}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-slate-500">Número de contacto de la sucursal</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div>
                      <p className="text-xs font-bold text-blue-900 mb-1">Personalización avanzada</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Después podrás agregar logos, colores de marca, y configuraciones avanzadas desde el panel de administración.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con Botones */}
          <div className="px-10 py-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              {step > 0 && (
                <Button
                  onClick={handlePrev}
                  disabled={isCreating}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-semibold border-slate-300 hover:bg-white disabled:opacity-50"
                >
                  <ArrowLeft01Icon className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  Anterior
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="h-12 px-8 rounded-xl font-bold flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Siguiente
                  <ArrowRight01Icon className="w-5 h-5 ml-2" strokeWidth={2.5} />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateBranch}
                  disabled={isCreating || !formData.name.trim()}
                  className="h-12 px-8 rounded-xl font-bold flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loading02Icon className="w-5 h-5 mr-2 animate-spin" strokeWidth={2.5} />
                      Creando sucursal...
                    </>
                  ) : (
                    <>
                      <CheckmarkCircle01Icon className="w-5 h-5 mr-2" strokeWidth={2.5} />
                      Crear Sucursal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
