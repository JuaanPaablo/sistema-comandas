import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ===== UTILIDADES DE CLASES CSS =====
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== UTILIDADES DE FECHAS =====
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isExpired(date: string | Date): boolean {
  return new Date(date) < new Date();
}

export function daysUntilExpiry(date: string | Date): number {
  const today = new Date();
  const expiryDate = new Date(date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ===== UTILIDADES DE VALIDACIÓN =====
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
}

// ===== UTILIDADES DE NÚMEROS =====
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function roundToDecimals(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ===== UTILIDADES DE ARRAYS =====
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ===== UTILIDADES DE STRINGS =====
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ===== UTILIDADES DE IDS =====
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString().slice(2, 6);
  return `ORD${year}${month}${day}${random}`;
}

// ===== UTILIDADES DE VALIDACIÓN DE FORMULARIOS =====
export function validateRequired(value: any): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function validateMinValue(value: number, min: number): boolean {
  return value >= min;
}

export function validateMaxValue(value: number, max: number): boolean {
  return value <= max;
}

// ===== UTILIDADES DE ERRORES =====
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'Ha ocurrido un error inesperado';
}

// ===== UTILIDADES DE PAGINACIÓN =====
export function paginateArray<T>(
  array: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; pages: number } {
  const total = array.length;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = array.slice(start, end);
  
  return { data, total, pages };
}

// ===== UTILIDADES DE DEBOUNCE =====
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
