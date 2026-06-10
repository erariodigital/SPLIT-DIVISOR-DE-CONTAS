/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  defaultRate: number; // fallbacks to convert to BRL
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real (BRL)', defaultRate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'Dólar (USD)', defaultRate: 5.25 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', defaultRate: 5.65 },
  GBP: { code: 'GBP', symbol: '£', name: 'Libra (GBP)', defaultRate: 6.60 },
  ARS: { code: 'ARS', symbol: 'ARS$', name: 'Peso Argentino (ARS)', defaultRate: 0.006 },
};

/**
 * Automatically identifies currency based on scanned text (store names, items, prices features).
 */
export function identifyCurrency(text: string): string {
  const norm = text.toUpperCase();
  if (norm.includes('€') || norm.includes('EUR') || norm.includes('PARIS') || norm.includes('FRANÇA') || norm.includes('ITALIA') || norm.includes('EUROPA')) {
    return 'EUR';
  }
  if (norm.includes('£') || norm.includes('GBP') || norm.includes('LONDON') || norm.includes('LIBRA') || norm.includes('INGLATERRA')) {
    return 'GBP';
  }
  if (norm.includes('ARS') || norm.includes('PESO') || norm.includes('ARGENTINA') || norm.includes('BUENOS AIRES') || norm.includes('ARS$')) {
    return 'ARS';
  }
  if (norm.includes('$') || norm.includes('USD') || norm.includes('DÓLAR') || norm.includes('DOLAR') || norm.includes('NEW YORK') || norm.includes('USA') || norm.includes('ESTADOS UNIDOS') || norm.includes('MIAMI')) {
    return 'USD';
  }
  return 'BRL';
}
