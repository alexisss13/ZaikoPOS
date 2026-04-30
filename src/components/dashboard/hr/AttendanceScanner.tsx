'use client';

import { useState } from 'react';
import { 
  ArrowLeft01Icon, 
  QrCode01Icon, 
  BarCode01Icon,
  Clock01Icon,
  UserIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AttendanceScannerProps {
  onClose: () => void;
}

export function AttendanceScanner({ onClose }: AttendanceScannerProps) {
  const [scanType, setScanType] = useState<'qr' | 'barcode' | 'manual'>('qr');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);

  const handleScan = async (type: 'checkin' | 'checkout') => {
    if (!inputValue.trim()) {
      toast.error('Ingresa el código para marcar asistencia');
      return;
    }

    try {
      setLoading(true);
      
      const body: any = { type };
      
      if (scanType === 'qr') {
        body.qrCode = inputValue.trim();
      } else if (scanType === 'barcode') {
        body.barcode = inputValue.trim();
      } else {
        body.userId = inputValue.trim();
      }

      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al marcar asistencia');
      }

      setLastScan({
        ...data,
        type,
        timestamp: new Date(),
      });

      toast.success(data.message);
      setInputValue('');
    } catch (error: any) {
      console.error('Error al marcar asistencia:', error);
      toast.error(error.message || 'Error al marcar asistencia');
    } finally {
      setLoading(false);
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
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Clock01Icon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Marcar Asistencia</h2>
            <p className="text-xs text-slate-500">Escanea o ingresa tu código</p>
          </div>
        </div>
      </div>

      {/* Scan Type Selector */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setScanType('qr')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
              scanType === 'qr'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <QrCode01Icon className="w-4 h-4" />
            <span className="text-sm font-bold">QR</span>
          </button>
          <button
            onClick={() => setScanType('barcode')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
              scanType === 'barcode'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <BarCode01Icon className="w-4 h-4" />
            <span className="text-sm font-bold">Código</span>
          </button>
          <button
            onClick={() => setScanType('manual')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
              scanType === 'manual'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="text-sm font-bold">Manual</span>
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 p-4 space-y-6">
        {/* Input */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700">
            {scanType === 'qr' && 'Código QR'}
            {scanType === 'barcode' && 'Código de Barras'}
            {scanType === 'manual' && 'ID de Usuario'}
          </label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              scanType === 'qr' ? 'Escanea o ingresa el código QR' :
              scanType === 'barcode' ? 'Escanea o ingresa el código de barras' :
              'Ingresa el ID del usuario'
            }
            className="h-12 text-center text-lg font-mono"
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleScan('checkin')}
            disabled={loading || !inputValue.trim()}
            className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
          >
            <Clock01Icon className="w-5 h-5 mr-2" />
            Marcar Entrada
          </Button>
          <Button
            onClick={() => handleScan('checkout')}
            disabled={loading || !inputValue.trim()}
            className="h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
          >
            <Clock01Icon className="w-5 h-5 mr-2" />
            Marcar Salida
          </Button>
        </div>

        {/* Last Scan Result */}
        {lastScan && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Último Registro</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Empleado:</span>
                <span className="text-sm font-bold text-slate-900">{lastScan.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Acción:</span>
                <span className={`text-sm font-bold ${
                  lastScan.type === 'checkin' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {lastScan.type === 'checkin' ? 'Entrada' : 'Salida'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Hora:</span>
                <span className="text-sm font-bold text-slate-900">
                  {lastScan.timestamp.toLocaleTimeString('es-PE')}
                </span>
              </div>
              {lastScan.attendance.isLate && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Retraso:</span>
                  <span className="text-sm font-bold text-orange-600">
                    {lastScan.attendance.lateMinutes} minutos
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Instrucciones</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Selecciona el tipo de código que vas a usar</li>
            <li>• Escanea o ingresa manualmente el código</li>
            <li>• Presiona "Marcar Entrada" al llegar</li>
            <li>• Presiona "Marcar Salida" al terminar tu turno</li>
          </ul>
        </div>
      </div>
    </div>
  );
}