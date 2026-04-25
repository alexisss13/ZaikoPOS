import { useState } from 'react';
import { ArrowLeft01Icon, CircleArrowUp02Icon, CircleArrowDown02Icon, Settings01Icon, PackageIcon, Store01Icon, Search01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface NewMovementMobileProps {
  onClose: () => void;
  onSuccess: () => void;
  branches: any[];
  products: any[];
}

const movementTypes = [
  { value: 'INPUT', label: 'Entrada', icon: CircleArrowUp02Icon, color: 'bg-emerald-500' },
  { value: 'OUTPUT', label: 'Salida', icon: CircleArrowDown02Icon, color: 'bg-red-500' },
  { value: 'ADJUSTMENT', label: 'Ajuste', icon: Settings01Icon, color: 'bg-amber-500' },
];

export function NewMovementMobile({ onClose, onSuccess, branches, products }: NewMovementMobileProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [branchId, setBranchId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!type || !branchId || !selectedVariant || !quantity) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetBranchId: branchId,
          variantId: selectedVariant.id,
          quantity: parseInt(quantity),
          reason: reason || 'Movimiento manual desde móvil',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear movimiento');
      }

      toast.success('Movimiento registrado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al registrar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={step === 1 ? onClose : () => setStep(step - 1)}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Nuevo Movimiento</h2>
          <p className="text-xs text-slate-500">Paso {step} de 4</p>
        </div>
        {step === 4 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !quantity}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-slate-900 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content - sin padding bottom extra */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ... resto del contenido ... */}
        {/* Step 1: Tipo de movimiento */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Tipo de movimiento</Label>
              <div className="space-y-2">
                {movementTypes.map((mt) => {
                  const Icon = mt.icon;
                  return (
                    <button
                      key={mt.value}
                      onClick={() => {
                        setType(mt.value);
                        setStep(2);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                        type === mt.value
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${mt.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">{mt.label}</p>
                        <p className="text-xs text-slate-500">
                          {mt.value === 'INPUT' && 'Agregar stock al inventario'}
                          {mt.value === 'OUTPUT' && 'Retirar stock del inventario'}
                          {mt.value === 'ADJUSTMENT' && 'Ajustar cantidad de stock'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Sucursal */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Sucursal</Label>
              <div className="space-y-2">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setBranchId(branch.id);
                      setStep(3);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      branchId === branch.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {branch.logoUrl ? (
                        <img src={branch.logoUrl} alt={branch.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <Store01Icon className="w-6 h-6 text-slate-400" strokeWidth={2} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-900">{branch.name}</p>
                      <p className="text-xs text-slate-500">{branch.address || 'Sin dirección'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Producto y variante */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Buscar producto</Label>
              <div className="relative">
                <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre o SKU..."
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>

            {!selectedProduct ? (
              <div className="space-y-2">
                {filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 active:scale-[0.98] transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <PackageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{product.title}</p>
                      <p className="text-xs text-slate-500">{product.sku || 'Sin SKU'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    {selectedProduct.images?.[0] ? (
                      <img src={selectedProduct.images[0]} alt={selectedProduct.title} className="w-full h-full object-cover" />
                    ) : (
                      <PackageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{selectedProduct.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cambiar
                  </button>
                </div>

                <div>
                  <Label className="text-sm font-bold text-slate-700 mb-2 block">Selecciona variante</Label>
                  <div className="space-y-2">
                    {selectedProduct.variants?.map((variant: any) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setStep(4);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                          selectedVariant?.id === variant.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className="font-semibold text-slate-900 text-sm">{variant.name}</span>
                        <span className="text-xs text-slate-500">
                          Stock: {
                            branchId 
                              ? (variant.stock?.find((s: any) => s.branchId === branchId)?.quantity || 0)
                              : (variant.stock?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) || 0)
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Cantidad y motivo */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                  {selectedProduct?.images?.[0] ? (
                    <img src={selectedProduct.images[0]} alt={selectedProduct.title} className="w-full h-full object-cover" />
                  ) : (
                    <PackageIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{selectedProduct?.title}</p>
                  <p className="text-xs text-slate-500">{selectedVariant?.name}</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Stock actual: <span className="font-bold text-slate-700">
                  {
                    branchId 
                      ? (selectedVariant?.stock?.find((s: any) => s.branchId === branchId)?.quantity || 0)
                      : (selectedVariant?.stock?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) || 0)
                  }
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="quantity" className="text-sm font-bold text-slate-700 mb-2 block">
                Cantidad *
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="h-14 text-lg font-bold text-center rounded-xl"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-bold text-slate-700 mb-2 block">
                Motivo (opcional)
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe el motivo del movimiento..."
                className="min-h-[100px] rounded-xl resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
