import { useState } from 'react';
import { ArrowLeft01Icon, Store01Icon, Search01Icon, PackageIcon, PlusSignIcon, MinusSignIcon, Delete02Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface NewTransferMobileProps {
  onClose: () => void;
  onSuccess: () => void;
  branches: any[];
  products: any[];
}

interface TransferItem {
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  image?: string;
}

export function NewTransferMobile({ onClose, onSuccess, branches, products }: NewTransferMobileProps) {
  const [step, setStep] = useState(1);
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (variant: any, product: any) => {
    const existing = items.find(i => i.variantId === variant.id);
    if (existing) {
      setItems(items.map(i => 
        i.variantId === variant.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, {
        variantId: variant.id,
        productTitle: product.title,
        variantName: variant.name,
        quantity: 1,
        image: product.images?.[0],
      }]);
    }
    setSelectedProduct(null);
    setSearchTerm('');
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setItems(items.map(i => {
      if (i.variantId === variantId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (variantId: string) => {
    setItems(items.filter(i => i.variantId !== variantId));
  };

  const handleSubmit = async () => {
    if (!fromBranchId || !toBranchId || items.length === 0) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error('Las sucursales de origen y destino deben ser diferentes');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromBranchId,
          toBranchId,
          items: items.map(i => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) throw new Error('Error al crear traslado');

      toast.success('Traslado creado correctamente');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Error al crear el traslado');
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
          <h2 className="text-lg font-black text-slate-900">Nuevo Traslado</h2>
          <p className="text-xs text-slate-500">Paso {step} de 3</p>
        </div>
        {step === 3 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Creando...' : `Crear (${items.length})`}
          </Button>
        )}
        {items.length > 0 && step !== 3 && (
          <div className="px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-full">
            {items.length}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-slate-900 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content - sin padding bottom extra */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Sucursal origen */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Sucursal de origen</Label>
              <div className="space-y-2">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setFromBranchId(branch.id);
                      setStep(2);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      fromBranchId === branch.id
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

        {/* Step 2: Sucursal destino */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Sucursal de destino</Label>
              <div className="space-y-2">
                {branches.filter(b => b.id !== fromBranchId).map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setToBranchId(branch.id);
                      setStep(3);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      toBranchId === branch.id
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

        {/* Step 3: Productos */}
        {step === 3 && (
          <div className="space-y-3">
            {/* Items agregados */}
            {items.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Productos a trasladar</Label>
                {items.map((item) => (
                  <div key={item.variantId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                      ) : (
                        <PackageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.productTitle}</p>
                      <p className="text-xs text-slate-500">{item.variantName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <MinusSignIcon className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <PlusSignIcon className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center active:scale-95 transition-all ml-1"
                      >
                        <Delete02Icon className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Buscar productos */}
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Agregar productos</Label>
              <div className="relative mb-3">
                <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              {!selectedProduct ? (
                <div className="space-y-2">
                  {filteredProducts.slice(0, 5).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <PackageIcon className="w-5 h-5 text-slate-400" />
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                      {selectedProduct.images?.[0] ? (
                        <img src={selectedProduct.images[0]} alt={selectedProduct.title} className="w-full h-full object-cover" />
                      ) : (
                        <PackageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="flex-1 font-bold text-slate-900 text-sm truncate">{selectedProduct.title}</p>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>

                  <Label className="text-xs font-bold text-slate-700 block">Selecciona variante</Label>
                  {selectedProduct.variants?.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => addItem(variant, selectedProduct)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                      <span className="font-semibold text-slate-900 text-sm">{variant.name}</span>
                      <PlusSignIcon className="w-4 h-4 text-slate-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
