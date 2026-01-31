// GCC Currencies configuration
export const GCC_CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
] as const;

export type CurrencyCode = typeof GCC_CURRENCIES[number]['code'];

export function getCurrencySymbol(code: CurrencyCode): string {
  const currency = GCC_CURRENCIES.find(c => c.code === code);
  return currency?.symbol || code;
}

export function formatCurrencyWithCode(amount: number, code: CurrencyCode = 'AED'): string {
  return `${code} ${amount.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
