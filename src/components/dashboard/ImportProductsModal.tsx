'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload02Icon, DownloadCircle02Icon, File02Icon, Loading02Icon, CheckmarkCircle02Icon, CancelCircleIcon, AlertCircleIcon } from 'hugeicons-react';
import * as XLSX from 'xlsx';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  suppliers: any[];
  branches: any[];
}

interface ImportResult {
  success: number;
  errors: { row: number; error: string }[];
}

export function ImportProductsModal({ isOpen, onClose, onSuccess, categories, suppliers, branches }: ImportProductsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    // Crear plantilla de Excel con columnas dinámicas para cada sucursal
    const baseColumns: any = {
      'Nombre del Producto *': 'Ejemplo: Laptop HP',
      'Categoría *': 'Electrónica',
      'SKU': 'LAP-HP-001',
      'Precio Base *': '1500.00',
      'Costo': '1200.00',
      'Precio Mayorista': '1400.00',
      'Cantidad Mínima Mayorista': '5',
      'Stock Mínimo': '10',
      'Proveedor': 'HP Inc',
    };

    // Agregar columnas de stock por cada sucursal
    branches.forEach((branch: any) => {
      baseColumns[`Stock ${branch.name}`] = '50';
    });

    baseColumns['Activo'] = 'SI';

    const template = [baseColumns];

    const ws = XLSX.utils.json_to_sheet(template);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 25 }, // Nombre
      { wch: 20 }, // Categoría
      { wch: 15 }, // SKU
      { wch: 12 }, // Precio Base
      { wch: 12 }, // Costo
      { wch: 18 }, // Precio Mayorista
      { wch: 25 }, // Cantidad Mínima
      { wch: 15 }, // Stock Mínimo
      { wch: 20 }, // Proveedor
    ];

    // Agregar ancho para columnas de stock
    branches.forEach(() => {
      colWidths.push({ wch: 18 });
    });

    colWidths.push({ wch: 10 }); // Activo

    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    // Agregar hoja de instrucciones
    const instructions = [
      { Instrucción: 'Los campos marcados con * son obligatorios' },
      { Instrucción: 'La categoría debe existir previamente en el sistema' },
      { Instrucción: 'El proveedor debe existir previamente (opcional)' },
      { Instrucción: 'Los precios deben ser números decimales (ej: 10.50)' },
      { Instrucción: 'Las cantidades deben ser números enteros' },
      { Instrucción: 'Activo debe ser SI o NO' },
      { Instrucción: 'El SKU debe ser único si se proporciona' },
      { Instrucción: 'Puedes especificar stock diferente para cada sucursal' },
      { Instrucción: '' },
      { Instrucción: 'Categorías disponibles:' },
      ...categories.map(c => ({ Instrucción: `  - ${c.name}` })),
      { Instrucción: '' },
      { Instrucción: 'Proveedores disponibles:' },
      ...suppliers.filter((s: any) => s.isActive).map((s: any) => ({ Instrucción: `  - ${s.name}` })),
      { Instrucción: '' },
      { Instrucción: 'Sucursales disponibles:' },
      ...branches.map((b: any) => ({ Instrucción: `  - ${b.name}` }))
    ];
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');
    
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    toast.success('Plantilla descargada correctamente');
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('El archivo está vacío');
        setIsProcessing(false);
        return;
      }

      const errors: { row: number; error: string }[] = [];
      const productsToCreate: any[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNumber = i + 2; // +2 porque Excel empieza en 1 y hay header

        try {
          // Validar campos obligatorios
          if (!row['Nombre del Producto *']) {
            errors.push({ row: rowNumber, error: 'Falta el nombre del producto' });
            continue;
          }

          if (!row['Categoría *']) {
            errors.push({ row: rowNumber, error: 'Falta la categoría' });
            continue;
          }

          if (!row['Precio Base *']) {
            errors.push({ row: rowNumber, error: 'Falta el precio base' });
            continue;
          }

          // Buscar categoría
          const category = categories.find(c => 
            c.name.toLowerCase() === String(row['Categoría *']).toLowerCase()
          );

          if (!category) {
            errors.push({ row: rowNumber, error: `Categoría "${row['Categoría *']}" no encontrada` });
            continue;
          }

          // Buscar proveedor (opcional)
          let supplierId = null;
          if (row['Proveedor']) {
            const supplier = suppliers.find((s: any) => 
              s.name.toLowerCase() === String(row['Proveedor']).toLowerCase() && s.isActive
            );
            if (supplier) {
              supplierId = supplier.id;
            }
          }

          // Parsear valores
          const basePrice = parseFloat(String(row['Precio Base *']).replace(',', '.'));
          if (isNaN(basePrice) || basePrice <= 0) {
            errors.push({ row: rowNumber, error: 'Precio base inválido' });
            continue;
          }

          const product: any = {
            title: String(row['Nombre del Producto *']).trim(),
            categoryId: category.id,
            supplierId,
            sku: row['SKU'] ? String(row['SKU']).trim() : null,
            basePrice,
            cost: row['Costo'] ? parseFloat(String(row['Costo']).replace(',', '.')) : 0,
            wholesalePrice: row['Precio Mayorista'] ? parseFloat(String(row['Precio Mayorista']).replace(',', '.')) : null,
            wholesaleMinCount: row['Cantidad Mínima Mayorista'] ? parseInt(String(row['Cantidad Mínima Mayorista'])) : null,
            minStock: row['Stock Mínimo'] ? parseInt(String(row['Stock Mínimo'])) : 5,
            active: row['Activo'] ? String(row['Activo']).toUpperCase() === 'SI' : true,
            branchStocks: {} as Record<string, number>
          };

          // Leer stock de cada sucursal
          branches.forEach((branch: any) => {
            const stockKey = `Stock ${branch.name}`;
            if (row[stockKey]) {
              const stockValue = parseInt(String(row[stockKey]));
              if (!isNaN(stockValue) && stockValue > 0) {
                product.branchStocks[branch.id] = stockValue;
              }
            }
          });

          productsToCreate.push(product);
        } catch (error) {
          errors.push({ row: rowNumber, error: 'Error al procesar la fila' });
        }
      }

      // Crear productos
      let successCount = 0;
      for (const product of productsToCreate) {
        try {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
          });

          if (res.ok) {
            successCount++;
          } else {
            const data = await res.json();
            errors.push({ 
              row: productsToCreate.indexOf(product) + 2, 
              error: data.error || 'Error al crear producto' 
            });
          }
        } catch (error) {
          errors.push({ 
            row: productsToCreate.indexOf(product) + 2, 
            error: 'Error de conexión' 
          });
        }
      }

      setResult({ success: successCount, errors });

      if (successCount > 0) {
        toast.success(`${successCount} producto(s) importado(s) correctamente`);
        onSuccess();
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} error(es) encontrado(s)`);
      }

    } catch (error) {
      toast.error('Error al procesar el archivo');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
        return;
      }
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
        return;
      }
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
        
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm shrink-0">
            <File02Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              Importar Productos desde Excel
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Carga masiva de productos usando una plantilla de Excel
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          
          {/* Descargar Plantilla */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-900 mb-1">Paso 1: Descarga la plantilla</h3>
                <p className="text-xs text-blue-700 mb-3">
                  Descarga la plantilla de Excel, llénala con tus productos y súbela aquí.
                </p>
                <Button 
                  onClick={downloadTemplate}
                  variant="outline"
                  className="h-9 text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                >
                  <DownloadCircle02Icon className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Descargar Plantilla
                </Button>
              </div>
            </div>
          </div>

          {/* Área de carga */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Paso 2: Sube tu archivo</h3>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              
              <div className="flex flex-col items-center justify-center text-center">
                {isProcessing ? (
                  <>
                    <Loading02Icon className="w-12 h-12 text-emerald-600 animate-spin mb-3" />
                    <p className="text-sm font-bold text-slate-700">Procesando archivo...</p>
                    <p className="text-xs text-slate-500 mt-1">Esto puede tomar unos momentos</p>
                  </>
                ) : (
                  <>
                    <Upload02Icon className="w-12 h-12 text-slate-400 mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-bold text-slate-700 mb-1">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-slate-500">
                      Formatos soportados: .xlsx, .xls
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Resultados */}
          {result && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Resultados de la Importación</h3>
              
              {result.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckmarkCircle02Icon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-bold text-green-900">
                      {result.success} producto(s) importado(s) correctamente
                    </p>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <CancelCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">
                        {result.errors.length} error(es) encontrado(s)
                      </p>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-red-700 bg-white p-2 rounded border border-red-100">
                        <span className="font-bold">Fila {err.row}:</span> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            className="h-10 text-xs font-bold"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
