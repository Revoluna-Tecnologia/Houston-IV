'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Especialidade } from '../../services/types';

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface MedicosFiltersValue {
  search: string;
  especialidadeId: string;
  status: 'all' | 'ativo' | 'inativo';
}

export interface MedicosFiltersProps {
  especialidades: Especialidade[];
  value: MedicosFiltersValue;
  onChange: (value: MedicosFiltersValue) => void;
  isLoading?: boolean;
}

export function MedicosFilters({
  especialidades,
  value,
  onChange,
  isLoading,
}: MedicosFiltersProps) {
  const t = useTranslations('Medicos.filters');
  const tCommon = useTranslations('Common');
  const [localValue, setLocalValue] = useState<MedicosFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (key: keyof MedicosFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: MedicosFiltersValue = {
      search: '',
      especialidadeId: 'all',
      status: 'all',
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.search !== '' ||
    localValue.especialidadeId !== 'all' ||
    localValue.status !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <div className="relative flex-1 min-w-[250px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </div>
        <Input
          placeholder={t('searchPlaceholder')}
          value={localValue.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={localValue.especialidadeId || 'all'}
        onValueChange={(v) => handleChange('especialidadeId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('specialty')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allSpecialties')}</SelectItem>
          {especialidades.map((esp) => (
            <SelectItem key={esp.id} value={esp.id}>
              {esp.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.status}
        onValueChange={(v) => handleChange('status', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tCommon('status.all')}</SelectItem>
          <SelectItem value="ativo">{tCommon('status.active')}</SelectItem>
          <SelectItem value="inativo">{tCommon('status.inactive')}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          {tCommon('actions.clearFilters')}
        </Button>
      )}
    </div>
  );
}
