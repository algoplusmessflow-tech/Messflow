// Localization utilities for GCC

import { CurrencyCode, formatCurrencyWithCode } from './currencies';

/**
 * Format a number as currency (default AED)
 * @deprecated Use useCurrency hook instead for dynamic currency
 */
export function formatCurrency(amount: number): string {
  return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with specific currency code
 */
export function formatWithCurrency(amount: number, currency: CurrencyCode = 'AED'): string {
  return formatCurrencyWithCode(amount, currency);
}

/**
 * Format a date in GCC format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date for display with day name
 */
export function formatDateWithDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayName = d.toLocaleDateString('en-AE', { weekday: 'short' });
  return `${dayName}, ${formatDate(d)}`;
}

/**
 * Parse a DD/MM/YYYY string to Date
 */
export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get date input value (YYYY-MM-DD format for HTML input)
 */
export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate plan expiry date based on joining date (1 month later)
 */
export function calculateExpiryDate(joiningDate: Date): Date {
  const expiry = new Date(joiningDate);
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry;
}

/**
 * Get days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format month-year for salary payments
 */
export function formatMonthYear(date: Date = new Date()): string {
  return date.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' });
}
