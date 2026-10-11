import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Ethiopian Birr (ETB)
 */
export function formatETB(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB';
}

export function clinicDateInputValue(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function clinicTimeValue(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.hour}:${values.minute}`;
}

/**
 * Format phone number to clean Ethiopian style (+251 9... or 09...)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('251') && cleaned.length >= 12) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  }
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return `+251 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  }
  return phone;
}

export function formatDateSafe(dateStr?: string, pattern: string = 'MMM dd, yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    return format(d, pattern);
  } catch {
    return dateStr;
  }
}

export function formatTimeSafe(timeStr?: string): string {
  if (!timeStr) return '—';
  // If in HH:mm
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    const [hours, mins] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins < 10 ? '0' : ''}${mins} ${period}`;
  }
  // If ISO string
  try {
    return format(parseISO(timeStr), 'h:mm a');
  } catch {
    return timeStr;
  }
}

export function getRelativeDayString(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}
