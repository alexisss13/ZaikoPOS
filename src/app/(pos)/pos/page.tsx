'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Search, LayoutGrid, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingBag, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  barcode: string | null;
  categoryId: string;
  branchStock?: { branchId: string; quantity: number }[];
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function PosPage() {
  const { user } = useAuth();
  
  const { data: products, isLoading: loadingProducts } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categories, isLoading: loadingCats } = useSWR<Category[]>('/api/categories', fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const localStock = p.branchStock?.find(bs => bs.branchId === user?.branchId)?.quantity || 0;
      
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm);
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory, user?.branchId]);

  const addToCart = (product: Product) => {
    const localStock = product.branchStock?.find(bs => bs.branchId === user?.branchId)?.quantity || 0;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= localStock) {
          toast.error(`Solo hay ${localStock} unidades disponibles de ${product.title}`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      if (localStock <= 0) {
        toast.error('Producto agotado en esta sucursal');
        return prev;
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty < 1) return item; 
        
        const localStock = item.branchStock?.find(bs => bs.branchId === user?.branchId)?.quantity || 0;
        if (newQty > localStock) {
          toast.error('Límite de stock alcanzado');
          return item;
        }
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.cartQuantity), 0);
  const total = subtotal; 

  return (
    <div className="flex h-full w-full">
      
      {/* 📦 LADO IZQUIERDO: CATÁLOGO Y BUSCADOR (70%) */}
      <div className="flex-1 flex flex-col bg-slate-50 h-full border-r border-slate-200">
        
        {/* Top: Buscador y Categorías */}
        <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3 shadow-sm z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              autoFocus
              placeholder="Escanear código de barras o buscar producto..." 
              className="pl-10 h-12 text-lg bg-slate-100 border-none focus-visible:ring-blue-600 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            <Button 
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full shrink-0 h-8 text-xs font-bold"
              onClick={() => setSelectedCategory('ALL')}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Todos
            </Button>
            {categories?.map(cat => (
              <Button 
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'} 
                size="sm" 
                className="rounded-full shrink-0 h-8 text-xs font-medium"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {loadingProducts || loadingCats ? (
              Array(10).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
            ) : filteredProducts.map(product => {
              const localStock = product.branchStock?.find(bs => bs.branchId === user?.branchId)?.quantity || 0;
              const isOutOfStock = localStock <= 0;

              return (
                <div 
                  key={product.id} 
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all select-none
                    ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-blue-400 active:scale-95'}
                  `}
                >
                  <div className="aspect-video bg-slate-100 relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-8 h-8" /></div>
                    )}
                    <Badge variant={isOutOfStock ? 'destructive' : 'secondary'} className="absolute top-2 right-2 text-[10px] shadow-sm font-black">
                      {localStock} un.
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{product.title}</p>
                    <p className="text-blue-600 font-black text-lg mt-1">S/ {Number(product.price).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🛒 LADO DERECHO: TICKET DE VENTA (30%) */}
      <div className="w-[350px] xl:w-[400px] flex flex-col bg-white h-full shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.03)] z-10">
        
        {/* Cabecera del Ticket */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" /> Venta Actual
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCart([])} disabled={cart.length === 0} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs h-8">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpiar
          </Button>
        </div>

        {/* Lista de Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-50">
              <ShoppingBag className="w-12 h-12" />
              <p className="font-medium text-sm">El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 relative group">
                <div className="flex justify-between pr-6">
                  <span className="font-bold text-slate-800 text-sm leading-tight">{item.title}</span>
                  <span className="font-black text-blue-600 text-sm shrink-0 whitespace-nowrap ml-2">
                    S/ {(Number(item.price) * item.cartQuantity).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-slate-400">S/ {Number(item.price).toFixed(2)} c/u</span>
                  <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50"><Minus className="w-3 h-3" /></button>
                    <span className="font-bold text-slate-800 w-4 text-center text-sm">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>

                <button onClick={() => removeFromCart(item.id)} className="absolute top-2.5 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Zona de Totales y Cobro (Fija abajo) */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-slate-500 text-sm font-medium">
              <span>Subtotal</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm font-medium">
              <span>Descuentos</span>
              <span>S/ 0.00</span>
            </div>
            <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-3xl font-black text-blue-600 tracking-tight">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="outline" className="h-12 border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 font-bold" disabled={cart.length === 0}>
              <Banknote className="w-4 h-4 mr-2" /> Efectivo
            </Button>
            <Button variant="outline" className="h-12 border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 font-bold" disabled={cart.length === 0}>
              <CreditCard className="w-4 h-4 mr-2" /> Tarjeta/Yape
            </Button>
          </div>

          <Button className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20" disabled={cart.length === 0}>
            COBRAR S/ {total.toFixed(2)}
          </Button>
        </div>
      </div>

    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}