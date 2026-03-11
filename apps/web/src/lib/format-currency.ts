'use client';

import { useFormatter } from 'next-intl';

export function useFormatCurrency() {
  const format = useFormatter();
  return (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' });
}
