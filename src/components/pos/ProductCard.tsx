'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UIProduct } from '@/types/product';

interface ProductCardProps {
  product: UIProduct;
  onAdd: (product: UIProduct) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const minStock = product.minStock ?? 0;
  // Solo vendible si tiene stock Y está activo
  const isSellable = product.stock > 0 && product.active;

  return (
    <Card 
      className={`relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md cursor-pointer group 
        ${!product.active ? 'opacity-50 grayscale bg-slate-100' : (!isSellable ? 'opacity-80 bg-slate-50' : 'bg-white')}`}
      onClick={() => isSellable && onAdd(product)}
    >
      <CardContent className="p-3 pt-4">
        <div className="flex justify-between items-start mb-2 gap-2">
           <Badge variant="outline" className="text-[10px] font-normal px-1 h-5 text-muted-foreground truncate max-w-20">
             {product.code || 'S/C'}
           </Badge>
           
           {/* Badge de Categoría */}
           {product.category && (
             <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-50 text-blue-700 hover:bg-blue-100 truncate max-w-20">
               {product.category}
             </Badge>
           )}
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 min-h-10 leading-tight text-slate-800">
          {product.name}
        </h3>

        {/* Alerta de Stock Bajo */}
        {product.stock <= minStock && isSellable && (
             <div className="mt-2 text-[10px] text-amber-600 font-medium flex items-center gap-1">
               Stock bajo: {product.stock}
             </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <span className="font-bold text-lg text-primary">
          S/ {product.price.toFixed(2)}
        </span>
        
        <Button 
          size="icon" 
          variant={isSellable ? "default" : "secondary"}
          className={`h-8 w-8 rounded-full shadow-sm transition-all ${isSellable ? 'group-hover:scale-110' : ''}`}
          disabled={!isSellable}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardFooter>

      {/* Overlays de Estado */}
      {!product.active && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 font-bold text-slate-400 transform -rotate-12 pointer-events-none border-2 border-slate-200 m-2 rounded-lg border-dashed">
          INACTIVO
        </div>
      )}
      
      {product.active && product.stock <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 font-bold text-red-300 transform -rotate-12 pointer-events-none">
          AGOTADO
        </div>
      )}
    </Card>
  );
}