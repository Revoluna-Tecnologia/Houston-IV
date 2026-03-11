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
import { DateRangePicker } from '@/components/houston';
import type { DateRange } from 'react-day-picker';
import type { Hospital, VagaStatus } from '../../services/types';

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

export interface VagasFiltersValue {
  status: VagaStatus | 'all';
  hospitalId: string;
  setorId: string;
  dateRange: DateRange | undefined;
  search: string;
}

export interface VagasFiltersProps {
  hospitals: Hospital[];
  setores: { id: string; nome: string; hospitalId: string }[];
  value: VagasFiltersValue;
  onChange: (value: VagasFiltersValue) => void;
  isLoading?: boolean;
}

export function VagasFilters({
  hospitals,
  setores,
  value,
  onChange,
  isLoading,
}: VagasFiltersProps) {
  const t = useTranslations('Vagas.filters');
  const tStatus = useTranslations('Vagas.status');
  const tCommon = useTranslations('Common.actions');
  const [localValue, setLocalValue] = useState<VagasFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const filteredSetores = localValue.hospitalId && localValue.hospitalId !== 'all'
    ? setores.filter((s) => s.hospitalId === localValue.hospitalId)
    : setores;

  const handleChange = (key: keyof VagasFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    if (key === 'hospitalId') {
      updated.setorId = 'all';
    }
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: VagasFiltersValue = {
      status: 'all',
      hospitalId: 'all',
      setorId: 'all',
      dateRange: undefined,
      search: '',
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.status !== 'all' ||
    localValue.hospitalId !== 'all' ||
    localValue.setorId !== 'all' ||
    localValue.dateRange !== undefined ||
    localValue.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <Select
        value={localValue.status}
        onValueChange={(v) => handleChange('status', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allStatus')}</SelectItem>
          <SelectItem value="aberta">{tStatus('open')}</SelectItem>
          <SelectItem value="anunciada">{tStatus('announced')}</SelectItem>
          <SelectItem value="fechada">{tStatus('closed')}</SelectItem>
          <SelectItem value="cancelada">{tStatus('cancelled')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localValue.hospitalId || 'all'}
        onValueChange={(v) => handleChange('hospitalId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('hospital')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allHospitals')}</SelectItem>
          {hospitals.map((hospital) => (
            <SelectItem key={hospital.id} value={hospital.id}>
              {hospital.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.setorId || 'all'}
        onValueChange={(v) => handleChange('setorId', v)}
        disabled={!localValue.hospitalId || localValue.hospitalId === 'all'}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('sector')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allSectors')}</SelectItem>
          {filteredSetores.map((setor) => (
            <SelectItem key={setor.id} value={setor.id}>
              {setor.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        value={localValue.dateRange}
        onChange={(range) => handleChange('dateRange', range)}
        placeholder={t('period')}
        className="w-[280px]"
      />

      <div className="relative flex-1 min-w-[200px]">
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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          {tCommon('clearFilters')}
        </Button>
      )}
    </div>
  );
}
