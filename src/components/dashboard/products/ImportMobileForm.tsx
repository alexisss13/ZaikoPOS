'use client';

import { useState } from 'react';
import { ArrowLeft01Icon, Upload02Icon, DownloadCircle02Icon, CheckmarkCircle02Icon, CancelCircleIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
  categories?: any[];
  suppliers?: any[];
  branches?: any[];
}

interface ImportResult {
  success: number;
  errors: { row: number; error: string }[];
}

export function ImportMobileForm({ 
  onClose, 
  onSuccess,
  categories = [],
  suppliers = [],
  branches = []
}: ImportMobileFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const downloadTemplate = () => {
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

    branches.forEach((branch: any) => {
      baseColumns[`Stock ${branch.name}`] = '50';
    });

    baseColumns['Activo'] = 'SI';

    const template = [baseColumns];
    const ws = XLSX.utils.json_to_sheet(template);
    
    const colWidths = [
      { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 20 }
    ];

    branches.forEach(() => colWidths.push({ wch: 18 }));
    colWidths.push({ wch: 10 });

    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    const instructions = [
      { Instrucción: 'Los campos marcados con * son obligatorios' },
      { Instrucción: 'La categoría debe existir previamente' },
      { Instrucción: 'Los precios deben ser números decimales' },
      { Instrucción: 'Activo debe ser SI o NO' },
      { Instrucción: '' },
      { Instrucción: 'Categorías disponibles:' },
      ...categories.map(c => ({ Instrucción: `  - ${c.name}` })),
      { Instrucción: '' },
      { Instrucción: 'Proveedores disponibles:' },
      ...suppliers.filter((s: any) => s.isActive).map((s: any) => ({ Instrucción: `  - ${s.name}` })),
    ];
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');
    
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    toast.success('Plantilla descargada');
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResult(null);
    setFileName(file.name);

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
        const rowNumber = i + 2;

        try {
          if (!row['Nombre del Producto *']) {
            errors.push({ row: rowNumber, error: 'Falta el nombre' });
            continue;
          }

          if (!row['Categoría *']) {
            errors.push({ row: rowNumber, error: 'Falta la categoría' });
            continue;
          }

          if (!row['Precio Base *']) {
            errors.push({ row: rowNumber, error: 'Falta el precio' });
            continue;
          }

          const category = categories.find(c => 
            c.name.toLowerCase() === String(row['Categoría *']).toLowerCase()
          );

          if (!category) {
            errors.push({ row: rowNumber, error: `Categoría "${row['Categoría *']}" no existe` });
            continue;
          }

          let supplierId = null;
          if (row['Proveedor']) {
            const supplier = suppliers.find((s: any) => 
              s.name.toLowerCase() === String(row['Proveedor']).toLowerCase()
            );
            if (supplier) {
              supplierId = supplier.id;
            }
          }

          const branchStocks: any[] = [];
          branches.forEach((branch: any) => {
            const stockKey = `Stock ${branch.name}`;
            if (row[stockKey]) {
              const quantity = parseInt(String(row[stockKey]));
              if (!isNaN(quantity) && quantity >= 0) {
                branchStocks.push({
                  branchId: branch.id,
                  quantity: quantity
                });
              }
            }
          });

          const product = {
            title: String(row['Nombre del Producto *']),
            categoryId: category.id,
            supplierId,
            basePrice: parseFloat(String(row['Precio Base *'])),
            cost: row['Costo'] ? parseFloat(String(row['Costo'])) : null,
            wholesalePrice: row['Precio Mayorista'] ? parseFloat(String(row['Precio Mayorista'])) : null,
            wholesaleMinCount: row['Cantidad Mínima Mayorista'] ? parseInt(String(row['Cantidad Mínima Mayorista'])) : null,
            minStock: row['Stock Mínimo'] ? parseInt(String(row['Stock Mínimo'])) : 5,
            sku: row['SKU'] ? String(row['SKU']) : null,
            active: row['Activo'] ? String(row['Activo']).toUpperCase() === 'SI' : true,
            branchStocks: branchStocks.length > 0 ? branchStocks : undefined,
          };

          productsToCreate.push(product);
        } catch (error: any) {
          errors.push({ row: rowNumber, error: error.message || 'Error al procesar fila' });
        }
      }

      if (productsToCreate.length === 0) {
        toast.error('No hay productos válidos para importar');
        setResult({ success: 0, errors });
        setIsProcessing(false);
        return;
      }

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsToCreate }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al importar');
      }

      const responseData = await res.json();
      
      setResult({
        success: responseData.created || productsToCreate.length,
        errors: errors,
      });

      toast.success(`${responseData.created || productsToCreate.length} productos importados`);
      
      if (errors.length === 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al procesar archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
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
          <h2 className="text-lg font-black text-slate-900">Importar Productos</h2>
          <p className="text-xs text-slate-500">Desde archivo Excel</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!result ? (
          <div className="space-y-4">
            {/* Paso 1: Descargar plantilla */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">Descarga la plantilla</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Usa nuestra plantilla Excel con el formato correcto
                  </p>
                  <Button
                    onClick={downloadTemplate}
                    className="w-full h-11 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold"
                  >
                    <DownloadCircle02Icon className="w-4 h-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                </div>
              </div>
            </div>

            {/* Paso 2: Llenar datos */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">Llena los datos</h3>
                  <p className="text-xs text-slate-600">
                    Completa la información de tus productos en el archivo Excel
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 3: Subir archivo */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">Sube el archivo</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Selecciona el archivo Excel completado
                  </p>
                  
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3" />
                      <p className="text-sm font-bold text-slate-700">Procesando...</p>
                      {fileName && <p className="text-xs text-slate-500 mt-1">{fileName}</p>}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 transition-colors bg-white">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload02Icon className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600 font-medium">Toca para seleccionar archivo</p>
                        <p className="text-[10px] text-slate-400 mt-1">Excel (.xlsx, .xls)</p>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-2xl p-4 mb-30 border border-blue-200">
              <h4 className="font-bold text-blue-900 text-sm mb-2">📋 Instrucciones</h4>
              <ul className="space-y-1 text-xs text-blue-700">
                <li>• Los campos con * son obligatorios</li>
                <li>• La categoría debe existir en el sistema</li>
                <li>• Los precios deben ser números decimales</li>
                <li>• Puedes especificar stock por sucursal</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resultado */}
            <div className={`rounded-2xl p-6 text-center ${
              result.errors.length === 0 ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'
            }`}>
              {result.errors.length === 0 ? (
                <>
                  <CheckmarkCircle02Icon className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-xl font-black text-emerald-900 mb-1">¡Importación exitosa!</h3>
                  <p className="text-sm text-emerald-700">
                    {result.success} producto{result.success !== 1 ? 's' : ''} importado{result.success !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <CancelCircleIcon className="w-16 h-16 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-xl font-black text-amber-900 mb-1">Importación con errores</h3>
                  <p className="text-sm text-amber-700 mb-1">
                    {result.success} producto{result.success !== 1 ? 's' : ''} importado{result.success !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-600">
                    {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''} encontrado{result.errors.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            {/* Errores */}
            {result.errors.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm">Errores encontrados</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="px-4 py-3 border-b border-slate-100 last:border-0">
                      <p className="text-xs font-bold text-red-600">Fila {error.row}</p>
                      <p className="text-xs text-slate-600">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setResult(null);
                  setFileName('');
                }}
                className="flex-1 h-11 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold"
              >
                Importar más
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
