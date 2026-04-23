'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BarCode02Icon, DownloadCircle02Icon, Search01Icon, Cancel01Icon, PrinterIcon } from 'hugeicons-react';
import Barcode from 'react-barcode';

interface Product {
  id: string;
  title: string;
  barcode?: string | null;
  code?: string | null;
  sku?: string | null;
}

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export function BarcodeGeneratorModal({ isOpen, onClose, products }: BarcodeGeneratorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p => 
    (p.barcode || p.code) && (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm) ||
      p.code?.includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const toggleProduct = (product: Product) => {
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
        const element = document.getElementById(`barcode-${product.id}`);
        if (element) {
          // Esperar a que el canvas se renderice completamente
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Crear un canvas temporal para incluir el título y el código de barras
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Configurar dimensiones del canvas
            canvas.width = 400;
            canvas.height = 200;
            
            // Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar el título
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            
            // Dividir el título en líneas si es muy largo
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
            
            // Dibujar el código de barras
            const barcodeCanvas = element.querySelector('canvas');
            if (barcodeCanvas) {
              ctx.drawImage(barcodeCanvas, (canvas.width - barcodeCanvas.width) / 2, y + 20);
            }
            
            // Descargar la imagen
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `codigo-barras-${product.barcode || product.code}.png`;
            link.href = dataUrl;
            link.click();
            
            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      toast.success(`${selectedProducts.length} código(s) descargado(s)`, { id: 'barcode-download' });
    } catch (error) {
      console.error('Error al generar imágenes:', error);
      toast.error('Error al generar las imágenes', { id: 'barcode-download' });
    }
  };

  const printBarcodes = () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    const printContent = selectedProducts.map((product, index) => {
      const barcodeValue = product.barcode || product.code || '000000';
      return `
        <div class="barcode-item">
          <h3 class="product-title">${product.title}</h3>
          <div class="barcode-container">
            <svg id="barcode-${product.id}"></svg>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Códigos de Barras</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0.5cm; 
              }
              @page { 
                margin: 0.5cm; 
                size: A4 portrait;
              }
              .barcode-item {
                page-break-inside: avoid;
              }
            }
            
            body { 
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .barcode-item {
              padding: 8px 0;
              margin-bottom: 12px;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .product-title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
              max-width: 100%;
              word-wrap: break-word;
              line-height: 1.3;
              padding: 0 10px;
            }
            
            .barcode-container {
              display: inline-block;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            ${selectedProducts.map(product => {
              const barcodeValue = product.barcode || product.code || '000000';
              return `JsBarcode("#barcode-${product.id}", "${barcodeValue}", {
                format: "CODE128",
                width: 1.8,
                height: 50,
                fontSize: 14,
                textMargin: 6,
                margin: 5
              });`;
            }).join('\n')}
            
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 100);
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-slate-900 p-2.5 rounded-xl shadow-sm shrink-0">
            <BarCode02Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              Generar Códigos de Barras
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Selecciona productos para imprimir o descargar sus códigos de barras
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          
          {/* Buscador */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Buscar Productos</Label>
            <div className="relative">
              <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <Input 
                placeholder="Buscar por nombre, código de barras o SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border-slate-200"
              />
            </div>
          </div>

          {/* Productos seleccionados */}
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-900">
                  {selectedProducts.length} producto(s) seleccionado(s)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  Limpiar selección
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(product => (
                  <div 
                    key={product.id}
                    className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-900"
                  >
                    <span className="truncate max-w-[200px]">{product.title}</span>
                    <button
                      onClick={() => toggleProduct(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Cancel01Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de productos */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Productos Disponibles ({filteredProducts.length})
            </Label>
            <div className="bg-white rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {searchTerm ? 'No se encontraron productos' : 'No hay productos con código de barras'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.find(p => p.id === product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProduct(product)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">
                            {product.title}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">
                            {product.barcode || product.code}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-3 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-slate-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vista previa visible para generar imágenes */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            {selectedProducts.map(product => (
              <div 
                key={product.id}
                id={`barcode-${product.id}`}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '400px'
                }}
              >
                <h3 style={{
                  fontWeight: 900,
                  color: 'black',
                  textAlign: 'center',
                  fontSize: '16px',
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  width: '100%',
                  marginBottom: '16px',
                  padding: '0 8px'
                }}>
                  {product.title}
                </h3>
                <Barcode 
                  value={product.barcode || product.code || '000000'} 
                  width={2} 
                  height={60} 
                  fontSize={16} 
                  textMargin={8} 
                  margin={10} 
                  format="CODE128" 
                  background="#ffffff" 
                  lineColor="#000000" 
                  renderer="canvas"
                />
              </div>
            ))}
          </div>

        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-10 text-xs font-bold"
          >
            Cerrar
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={downloadAsPNG}
              disabled={selectedProducts.length === 0}
              className="h-10 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <DownloadCircle02Icon className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Descargar PNG
            </Button>
            <Button 
              onClick={printBarcodes}
              disabled={selectedProducts.length === 0}
              className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
            >
              <PrinterIcon className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Imprimir
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
