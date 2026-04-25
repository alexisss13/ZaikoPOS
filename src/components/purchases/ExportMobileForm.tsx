'use client';

import { useState } from 'react';
import { ArrowLeft01Icon, DownloadCircle02Icon, Cancel01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface ExportMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onExportExcel: () => Promise<void>;
  onExportPDF: () => Promise<void>;
}

export function ExportMobileForm({ onClose, onSuccess, onExportExcel, onExportPDF }: ExportMobileFormProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (exportFn: () => Promise<void>, type: string) => {
    setIsExporting(true);
    try {
      await exportFn();
      onSuccess();
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
    } finally {
      setIsExporting(false);
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
          <h2 className="text-lg font-black text-slate-900">Exportar Órdenes</h2>
          <p className="text-xs text-slate-500">Descargar datos</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Selecciona el formato</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport(onExportExcel, 'Excel')}
                disabled={isExporting}
                className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left active:scale-95 transition-transform disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <DownloadCircle02Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900">Exportar a Excel</p>
                    <p className="text-xs text-emerald-700">Archivo .xlsx con todas las órdenes filtradas</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport(onExportPDF, 'PDF')}
                disabled={isExporting}
                className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-left active:scale-95 transition-transform disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                    <DownloadCircle02Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">Exportar a PDF</p>
                    <p className="text-xs text-red-700">Documento PDF con resumen de órdenes</p>
                  </div>
                </div>
              </button>
            </div>

            {isExporting && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-blue-900">Generando archivo...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}