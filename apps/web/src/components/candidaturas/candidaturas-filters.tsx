'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/houston';
import type { DateRange } from 'react-day-picker';
import type { CandidaturaStatus, Vaga, Medico } from '@/services/types';

const _SearchIcon = () => (
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

export interface CandidaturasFiltersValue {
  status: CandidaturaStatus | 'all';
  vagaId: string;
  medicoId: string;
  dateRange: DateRange | undefined;
}

export interface CandidaturasFiltersProps {
  vagas: Vaga[];
  medicos: Medico[];
  value: CandidaturasFiltersValue;
  onChange: (value: CandidaturasFiltersValue) => void;
  isLoading?: boolean;
}

export const CandidaturasFilters = memo(function CandidaturasFilters({
  vagas,
  medicos,
  value,
  onChange,
  isLoading,
}: CandidaturasFiltersProps) {
  const t = useTranslations('Candidaturas.filters');
  const tCommon = useTranslations('Common.actions');
  const [localValue, setLocalValue] = useState<CandidaturasFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((key: keyof CandidaturasFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    setLocalValue(updated);
    onChange(updated);
  }, [localValue, onChange]);

  const handleClear = useCallback(() => {
    const cleared: CandidaturasFiltersValue = {
      status: 'all',
      vagaId: 'all',
      medicoId: 'all',
      dateRange: undefined,
    };
    setLocalValue(cleared);
    onChange(cleared);
  }, [onChange]);

  const hasFilters =
    localValue.status !== 'all' ||
    localValue.vagaId !== 'all' ||
    localValue.medicoId !== 'all' ||
    localValue.dateRange !== undefined;

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
          <SelectItem value="pendente">{t('pending')}</SelectItem>
          <SelectItem value="aprovada">{t('approved')}</SelectItem>
          <SelectItem value="rejeitada">{t('rejected')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localValue.vagaId || 'all'}
        onValueChange={(v) => handleChange('vagaId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('vaga')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allVagas')}</SelectItem>
          {vagas.map((vaga) => (
            <SelectItem key={vaga.id} value={vaga.id}>
              {vaga.horaInicio} - {vaga.horaFim}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.medicoId || 'all'}
        onValueChange={(v) => handleChange('medicoId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('medico')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allMedicos')}</SelectItem>
          {medicos.map((medico) => (
            <SelectItem key={medico.id} value={medico.id}>
              {medico.nome} - {medico.crm}
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

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          {tCommon('clearFilters')}
        </Button>
      )}
    </div>
  );
});
