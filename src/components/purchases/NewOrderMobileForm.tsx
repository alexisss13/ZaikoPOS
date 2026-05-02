'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, ShoppingCart01Icon, PlusSignIcon, Cancel01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface NewOrderMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  cost: number;
}

export function NewOrderMobileForm({ onClose, onSuccess }: NewOrderMobileFormProps) {
  // Todos los hooks deben ejecutarse siempre en el mismo orden
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    // Cargar proveedores y productos
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [suppliersRes, productsRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/products?forPOS=true') // Usar forPOS=true para obtener variantes completas
        ]);
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          console.log('Suppliers loaded:', suppliersData.length);
          setSuppliers(Array.isArray(suppliersData) ? suppliersData.filter((s: any) => s.isActive) : []);
        }
        
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          console.log('=== PRODUCTS DATA ===');
          
          // Verificar si la respuesta es un array o un objeto con productos
          let allProducts = [];
          if (Array.isArray(productsData)) {
            allProducts = productsData;
            console.log('Products loaded (array):', allProducts.length);
          } else if (productsData.products && Array.isArray(productsData.products)) {
            allProducts = productsData.products;
            console.log('Products loaded (object):', allProducts.length);
          } else {
            console.error('Unexpected products data format:', productsData);
            allProducts = [];
          }
          
          if (allProducts.length > 0) {
            console.log('First product structure:', allProducts[0]);
            if (allProducts[0].variants && allProducts[0].variants.length > 0) {
              console.log('First variant structure:', allProducts[0].variants[0]);
            }
          }
          
          // Filtrar productos que tengan al menos una variante
          const productsWithVariants = allProducts.filter((p: any) => 
            p.variants && Array.isArray(p.variants) && p.variants.length > 0
          );
          
          console.log('Products with variants:', productsWithVariants.length);
          if (productsWithVariants.length > 0) {
            console.log('First product with variants:', productsWithVariants[0]);
          }
          setProducts(productsWithVariants);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Asegurar que siempre tengamos arrays vacíos en caso de error
        setSuppliers([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const addProduct = (product: any, variant: any) => {
    console.log('Adding product:', product.id, 'variant:', variant.id);
    console.log('Product:', product);
    console.log('Variant:', variant);
    
    const existingIndex = orderItems.findIndex(
      item => item.variantId === variant.id
    );
    
    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      const newItem: OrderItem = {
        id: `${product.id}-${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        productTitle: product.title,
        variantName: variant.name,
        quantity: 1,
        cost: Number(product.cost || 0),
      };
      console.log('New item created:', newItem);
      setOrderItems([...orderItems, newItem]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    // No eliminar automáticamente cuando sea 0, solo actualizar
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
    ));
  };

  const updateCost = (itemId: string, cost: number) => {
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, cost: Math.max(0, cost) } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.cost), 0);
  };

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId: formData.supplierId,
        orderDate: new Date(formData.orderDate + 'T12:00:00').toISOString(),
        notes: formData.notes || null,
        items: orderItems.map(item => {
          console.log('Item:', item.id, '-> variantId:', item.variantId);
          return {
            variantId: item.variantId,  // Usar el variantId directo del item
            quantity: item.quantity,
            cost: item.cost,
          };
        }),
        totalAmount: getTotalAmount(),
      };

      console.log('Creating purchase order with payload:', JSON.stringify(payload, null, 2));

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Purchase order creation failed:', errorData);
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      toast.success('Orden de compra creada');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al crear la orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.supplierId;
    if (step === 2) {
      // Validar que haya productos y que todos tengan cantidad > 0 y costo > 0
      return orderItems.length > 0 && orderItems.every(item => item.quantity > 0 && item.cost > 0);
    }
    return true;
  };

  const getValidationErrors = () => {
    if (step !== 2) return [];
    
    const errors: string[] = [];
    orderItems.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`${item.productTitle} - ${item.variantName}: cantidad debe ser mayor a 0`);
      }
      if (item.cost <= 0) {
        errors.push(`${item.productTitle} - ${item.variantName}: costo debe ser mayor a 0`);
      }
    });
    
    return errors;
  };

  const filteredProducts = products.filter(product => {
    // Si hay búsqueda, buscar en título, slug del producto y SKU/barcode de variantes
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Buscar en el producto principal
      const productMatch = (
        (product.title && product.title.toLowerCase().includes(searchLower)) ||
        (product.slug && product.slug.toLowerCase().includes(searchLower))
      );
      
      // Buscar en las variantes
      const variantMatch = product.variants?.some((variant: any) => 
        (variant.name && variant.name.toLowerCase().includes(searchLower)) ||
        (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
        (variant.barcode && variant.barcode.toLowerCase().includes(searchLower))
      );
      
      return productMatch || variantMatch;
    }
    
    // Si no hay búsqueda y no se activó "mostrar todos", filtrar por stock bajo
    if (!showAllProducts) {
      return product.variants?.some((v: any) => {
        const totalStock = v.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
        return totalStock <= v.minStock;
      });
    }
    
    // Mostrar todos
    return product && product.title;
  });

  console.log('Search term:', searchTerm);
  console.log('Total products:', products.length);
  console.log('Filtered products:', filteredProducts.length);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={isLoading ? onClose : (step === 1 ? onClose : () => setStep(step - 1))}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Nueva Orden</h2>
          <p className="text-xs text-slate-500">
            {isLoading ? 'Cargando datos...' : `Paso ${step} de 3`}
          </p>
        </div>
        {!isLoading && step < 3 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            Continuar
          </Button>
        )}
        {!isLoading && step === 3 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Creando...' : 'Crear'}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {!isLoading && (
        <div className="h-1 bg-slate-100">
          <div 
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          // Loading content
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-500">Cargando proveedores y productos...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Proveedor */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplierId" className="text-sm font-bold text-slate-700 mb-2 block">
                    Proveedor *
                  </Label>
                  <select
                    id="supplierId"
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="">Selecciona un proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="orderDate" className="text-sm font-bold text-slate-700 mb-2 block">
                    Fecha de orden
                  </Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-bold text-slate-700 mb-2 block">
                    Notas (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales sobre la orden..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Productos */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-bold text-slate-700 mb-2 block">
                    Buscar productos
                  </Label>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    className="h-12 rounded-xl"
                  />
                  {!searchTerm && (
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-slate-500">
                        {showAllProducts ? `${products.length} productos disponibles` : 'Mostrando productos con stock bajo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllProducts(!showAllProducts)}
                        className="text-slate-700 font-bold hover:text-slate-900 underline"
                      >
                        {showAllProducts ? 'Ver solo stock bajo' : 'Ver todos'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Productos seleccionados */}
                {orderItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Productos seleccionados ({orderItems.length})
                    </h3>
                    <div className="space-y-2">
                      {orderItems.map((item) => {
                        const hasQuantityError = item.quantity <= 0;
                        const hasCostError = item.cost <= 0;
                        
                        return (
                          <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                            hasQuantityError || hasCostError ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-transparent'
                          }`}>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900">{item.productTitle}</p>
                              <p className="text-[10px] text-slate-500">{item.variantName}</p>
                              {(hasQuantityError || hasCostError) && (
                                <p className="text-[9px] text-red-600 mt-1">
                                  {hasQuantityError && hasCostError ? 'Cantidad y costo requeridos' : 
                                   hasQuantityError ? 'Cantidad requerida' : 'Costo requerido'}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateQuantity(item.id, 0);
                                  } else {
                                    updateQuantity(item.id, parseInt(value) || 0);
                                  }
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === '0') {
                                    e.target.select();
                                  }
                                }}
                                className={`w-16 h-8 text-xs text-center ${hasQuantityError ? 'border-red-300 bg-red-50' : ''}`}
                                placeholder="0"
                              />
                              <span className="text-xs text-slate-500">×</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.cost || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateCost(item.id, 0);
                                  } else {
                                    updateCost(item.id, parseFloat(value) || 0);
                                  }
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === '0') {
                                    e.target.select();
                                  }
                                }}
                                className={`w-20 h-8 text-xs text-center ${hasCostError ? 'border-red-300 bg-red-50' : ''}`}
                                placeholder="0.00"
                              />
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50"
                            >
                              <Cancel01Icon className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                      <span className="text-sm font-bold text-slate-700">Total</span>
                      <span className="text-lg font-bold text-slate-900">
                        S/ {getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Lista de productos - SIEMPRE MOSTRAR SI HAY PRODUCTOS */}
                {products.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-30">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      {searchTerm ? `Resultados (${filteredProducts.length})` : (showAllProducts ? 'Todos los productos' : 'Productos con stock bajo')}
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">
                          {searchTerm ? 'No se encontraron productos' : 'No hay productos con stock bajo'}
                        </p>
                      ) : (
                        filteredProducts.map((product) => {
                          const variants = product.variants && Array.isArray(product.variants) ? product.variants : [];
                          if (variants.length === 0) return null;
                          
                          return variants.map((variant: any) => {
                            const totalStock = variant.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                            const isLowStock = totalStock <= (product.minStock || 5);
                            
                            return (
                              <button
                                key={`${product.id}-${variant.id}`}
                                onClick={() => addProduct(product, variant)}
                                className="w-full p-3 text-left rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-900">{product.title}</p>
                                    <p className="text-[10px] text-slate-500">{variant.name}</p>
                                    <p className="text-[10px] text-slate-400">
                                      Costo: S/ {Number(product.cost || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-right ml-2">
                                    <p className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                      Stock: {totalStock}
                                    </p>
                                    <p className="text-[9px] text-slate-400">
                                      Mín: {product.minStock || 5}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          });
                        })
                      )}
                    </div>
                  </div>
                )}

                {products.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart01Icon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sin productos</h3>
                    <p className="text-sm text-slate-600">
                      No hay productos disponibles para crear órdenes de compra
                    </p>
                  </div>
                )}
                
                {/* Mensaje de validación */}
                {orderItems.length > 0 && !canGoNext() && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-red-800 mb-2">Corrige los siguientes errores:</h4>
                    <div className="space-y-1">
                      {getValidationErrors().map((error, index) => (
                        <p key={index} className="text-xs text-red-700">• {error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Resumen */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Resumen de la orden</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Proveedor:</span>
                      <span className="text-xs font-bold text-slate-900">
                        {suppliers.find(s => s.id === formData.supplierId)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Fecha:</span>
                      <span className="text-xs font-bold text-slate-900">
                        {new Date(formData.orderDate).toLocaleDateString('es-PE')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Productos:</span>
                      <span className="text-xs font-bold text-slate-900">
                        {orderItems.length}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">Total</span>
                      <span className="text-xl font-bold text-slate-900">
                        S/ {getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {formData.notes && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Notas</h3>
                    <p className="text-xs text-slate-600">{formData.notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}