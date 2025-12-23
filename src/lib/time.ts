import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'America/Lima';

export const getPeruDate = (date: Date = new Date()) => {
  return toZonedTime(date, TIMEZONE);
};

export const formatPeruDate = (date: Date, fmt: string = 'dd/MM/yyyy HH:mm:ss') => {
  const zoned = toZonedTime(date, TIMEZONE);
  return format(zoned, fmt, { timeZone: TIMEZONE });
};