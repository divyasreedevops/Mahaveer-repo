import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a date string or Date object.
 * Default format is DD/MM/YYYY.
 */
export const formatDate = (date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return '-';
  
  let d: Date;
  if (typeof date === 'string') {
    // Try parseISO first for ISO strings, fallback to new Date()
    d = parseISO(date);
    if (!isValid(d)) {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  if (!isValid(d)) return '-';
  return format(d, formatStr);
};

/**
 * Formats a date string or Date object to DD/MM/YYYY HH:mm.
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formats DOB to DD/MM/YYYY.
 */
export const formatDOB = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'dd/MM/yyyy');
};

/**
 * Formats a time string (HH:mm) to 12h format with AM/PM.
 */
export const formatTimeOnly = (time: string | null | undefined): string => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};
