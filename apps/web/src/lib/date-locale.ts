'use client';

import { useLocale } from 'next-intl';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  en: enUS,
  es: es,
};

export function useDateLocale(): Locale {
  const locale = useLocale();
  return localeMap[locale] || ptBR;
}
