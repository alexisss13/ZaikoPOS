'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft01Icon, Search01Icon, BarCode02Icon, DownloadCircle02Icon, CheckmarkCircle02Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Barcode from 'react-barcode';

interface BarcodeMobileFormProps {
  onClose: () => void;
  products?: any[];
}

const ITEMS_PER_PAGE = 5;

export function BarcodeMobileForm({ 
  onClose,
  products = []
}: BarcodeMobileFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter((p: any) => 
    (p.barcode || p.code) && (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm) ||
      p.code?.includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm]);

  // Infinite scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      
      // Si está cerca del final (100px antes), cargar más
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore) {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMore]);

  const toggleProduct = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const downloadAsPNG = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    try {
      toast.loading('Generando imágenes...', { id: 'barcode-download' });
      
      for (const product of selectedProducts) {
        const element = document.getElementById(`barcode-mobile-${product.id}`);
        if (element) {
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = 400;
            canvas.height = 200;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            
            const maxWidth = 360;
            const words = product.title.toUpperCase().split(' ');
            let line = '';
            let y = 30;
            
            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, canvas.width / 2, y);
                line = words[i] + ' ';
                y += 20;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, canvas.width / 2, y);
            
            const barcodeCanvas = element.querySelector('canvas');
            if (barcodeCanvas) {
              ctx.drawImage(barcodeCanvas, 20, y + 20, 360, 120);
            }
            
            const link = document.createElement('a');
            link.download = `codigo_${product.barcode || product.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        }
      }
      
      toast.success('Códigos descargados', { id: 'barcode-download' });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar códigos', { id: 'barcode-download' });
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Códigos de Barras</h2>
          <p className="text-xs text-slate-500">
            {selectedProducts.length > 0 ? `${selectedProducts.length} seleccionados` : `${filteredProducts.length} productos`}
          </p>
        </div>
        {selectedProducts.length > 0 && (
          <Button
            onClick={downloadAsPNG}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
          >
            <DownloadCircle02Icon className="w-4 h-4 mr-1.5" />
            Descargar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarCode02Icon className="w-16 h-16 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos con código de barras'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-30">
            {visibleProducts.map((product: any) => {
              const isSelected = selectedProducts.find(p => p.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <CheckmarkCircle02Icon className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{product.title}</p>
                      <p className="text-xs text-slate-500">
                        {product.sku && `SKU: ${product.sku} · `}
                        Código: {product.barcode || product.code}
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview del código de barras */}
                  <div id={`barcode-mobile-${product.id}`} className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                    <Barcode
                      value={product.barcode || product.code || '000000'}
                      width={1.5}
                      height={50}
                      fontSize={12}
                      margin={5}
                      format="CODE128"
                      background="#ffffff"
                      lineColor="#000000"
                    />
                  </div>
                </button>
              );
            })}
            
            {/* Loading indicator */}
            {hasMore && (
              <div className="flex items-center justify-center py-4">
                <div className="text-xs text-slate-400 font-medium">
                  Mostrando {visibleCount} de {filteredProducts.length}
                </div>
              </div>
            )}
            
            {!hasMore && filteredProducts.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center py-4">
                <div className="text-xs text-slate-300 font-medium">
                  · {filteredProducts.length} productos ·
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden print area */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
