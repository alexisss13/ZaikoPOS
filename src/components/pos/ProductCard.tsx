'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// DEFINICIÓN FLEXIBLE: Lo que el componente realmente necesita para pintar
export interface UIProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  code: string | null;
  minStock?: number; // Opcional
}

interface ProductCardProps {
  product: UIProduct;
  onAdd: (product: UIProduct) => void; // Adiós 'any'
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const hasStock = product.stock > 0;
  // Corrección: min-h-10 es la clase correcta de Tailwind 4/Standard
  const minStock = product.minStock || 5; 

  return (
    <Card 
      className={`relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md cursor-pointer group ${!hasStock ? 'opacity-60 bg-slate-50' : 'bg-white'}`}
      onClick={() => hasStock && onAdd(product)}
    >
      <CardContent className="p-4 pt-5">
        <div className="flex justify-between items-start mb-2">
           <Badge variant="outline" className="text-xs font-normal">
             {product.code || 'S/C'}
           </Badge>
           {product.stock <= minStock && hasStock && (
             <Badge variant="destructive" className="text-[10px] h-4 px-1">
               Bajo: {product.stock}
             </Badge>
           )}
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 min-h-10 leading-tight">
          {product.name}
        </h3>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="font-bold text-lg text-primary">
          S/ {product.price.toFixed(2)}
        </span>
        
        <Button 
          size="icon" 
          variant={hasStock ? "default" : "secondary"}
          className="h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={!hasStock}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardFooter>

      {!hasStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 font-bold text-slate-500 transform -rotate-12">
          AGOTADO
        </div>
      )}
    </Card>
  );
}