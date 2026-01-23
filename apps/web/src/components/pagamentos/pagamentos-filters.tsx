'use client';

import { useState, useEffect } from 'react';
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
import type { Medico, Hospital, PagamentoStatus } from '../../services/types';

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

export interface PagamentosFiltersValue {
  status: PagamentoStatus | 'all';
  medicoId: string;
  hospitalId: string;
  dateRange: DateRange | undefined;
}

export interface PagamentosFiltersProps {
  medicos: Medico[];
  hospitais: Hospital[];
  value: PagamentosFiltersValue;
  onChange: (value: PagamentosFiltersValue) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'autorizado', label: 'Autorizados' },
  { value: 'pago', label: 'Pagos' },
  { value: 'cancelado', label: 'Cancelados' },
];

export function PagamentosFilters({
  medicos,
  hospitais,
  value,
  onChange,
  isLoading,
}: PagamentosFiltersProps) {
  const [localValue, setLocalValue] = useState<PagamentosFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (key: keyof PagamentosFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: PagamentosFiltersValue = {
      status: 'all',
      medicoId: 'all',
      hospitalId: 'all',
      dateRange: undefined,
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.status !== 'all' ||
    localValue.medicoId !== 'all' ||
    localValue.hospitalId !== 'all' ||
    localValue.dateRange !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <Select
        value={localValue.status}
        onValueChange={(v) => handleChange('status', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.medicoId}
        onValueChange={(v) => handleChange('medicoId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Medico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os medicos</SelectItem>
          {medicos.map((medico) => (
            <SelectItem key={medico.id} value={medico.id}>
              {medico.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.hospitalId}
        onValueChange={(v) => handleChange('hospitalId', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Hospital" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os hospitais</SelectItem>
          {hospitais.map((hospital) => (
            <SelectItem key={hospital.id} value={hospital.id}>
              {hospital.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker
        value={localValue.dateRange}
        onChange={(range) => handleChange('dateRange', range)}
        placeholder="Periodo"
        className="w-[280px]"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
