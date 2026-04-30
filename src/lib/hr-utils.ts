import { prisma } from './prisma';

export async function generateQRCode(): Promise<string> {
  let qrCode: string;
  let exists = true;

  while (exists) {
    // Generar un código QR único de 8 caracteres
    qrCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const existingUser = await prisma.user.findUnique({
      where: { qrCode },
    });
    
    exists = !!existingUser;
  }

  return qrCode!;
}

export async function generateBarcode(): Promise<string> {
  let barcode: string;
  let exists = true;

  while (exists) {
    // Generar un código de barras único de 12 dígitos
    barcode = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    
    const existingUser = await prisma.user.findUnique({
      where: { barcode },
    });
    
    exists = !!existingUser;
  }

  return barcode!;
}

export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100; // Redondear a 2 decimales
}

export function isLateArrival(checkIn: Date, expectedStartTime: string): { isLate: boolean; lateMinutes: number } {
  const checkInTime = checkIn.toTimeString().substring(0, 5); // HH:mm
  const [expectedHour, expectedMinute] = expectedStartTime.split(':').map(Number);
  const [actualHour, actualMinute] = checkInTime.split(':').map(Number);
  
  const expectedMinutes = expectedHour * 60 + expectedMinute;
  const actualMinutes = actualHour * 60 + actualMinute;
  
  const lateMinutes = Math.max(0, actualMinutes - expectedMinutes);
  
  return {
    isLate: lateMinutes > 0,
    lateMinutes,
  };
}

export function calculatePayroll(
  baseSalary: number,
  hoursWorked: number,
  expectedHours: number,
  hourlyRate?: number
) {
  let baseAmount = baseSalary;
  let deductions = 0;
  let overtimeAmount = 0;

  if (hourlyRate && hoursWorked !== expectedHours) {
    // Si tiene tarifa por hora, calcular basado en horas trabajadas
    baseAmount = hoursWorked * hourlyRate;
    
    if (hoursWorked > expectedHours) {
      // Horas extra (1.5x la tarifa normal)
      const overtimeHours = hoursWorked - expectedHours;
      overtimeAmount = overtimeHours * hourlyRate * 0.5; // 50% adicional
    }
  } else if (hoursWorked < expectedHours) {
    // Descuento por horas no trabajadas
    const missingHours = expectedHours - hoursWorked;
    const hourlyDeduction = baseSalary / expectedHours;
    deductions = missingHours * hourlyDeduction;
  }

  return {
    baseAmount,
    overtimeAmount,
    deductions,
    totalAmount: baseAmount + overtimeAmount - deductions,
  };
}