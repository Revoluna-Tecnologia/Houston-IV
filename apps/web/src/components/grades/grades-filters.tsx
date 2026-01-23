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
import type { Hospital, GradeStatus } from '../../services/types';

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

export interface GradesFiltersValue {
  hospitalId: string;
  setorId: string;
  status: GradeStatus | 'all';
  mes?: number;
  ano?: number;
}

export interface GradesFiltersProps {
  hospitais: Hospital[];
  setores: { id: string; nome: string; hospitalId: string }[];
  value: GradesFiltersValue;
  onChange: (value: GradesFiltersValue) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'arquivada', label: 'Arquivada' },
];

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function GradesFilters({
  hospitais,
  setores,
  value,
  onChange,
  isLoading,
}: GradesFiltersProps) {
  const [localValue, setLocalValue] = useState<GradesFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const filteredSetores = localValue.hospitalId && localValue.hospitalId !== 'all'
    ? setores.filter((s) => s.hospitalId === localValue.hospitalId)
    : setores;

  const handleChange = (key: keyof GradesFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    if (key === 'hospitalId') {
      updated.setorId = 'all';
    }
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: GradesFiltersValue = {
      hospitalId: 'all',
      setorId: 'all',
      status: 'all',
      mes: undefined,
      ano: undefined,
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.hospitalId !== 'all' ||
    localValue.setorId !== 'all' ||
    localValue.status !== 'all' ||
    localValue.mes !== undefined ||
    localValue.ano !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
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

      <Select
        value={localValue.setorId}
        onValueChange={(v) => handleChange('setorId', v)}
        disabled={!localValue.hospitalId || localValue.hospitalId === 'all'}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os setores</SelectItem>
          {filteredSetores.map((setor) => (
            <SelectItem key={setor.id} value={setor.id}>
              {setor.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
        value={localValue.mes?.toString() || 'all'}
        onValueChange={(v) => handleChange('mes', v === 'all' ? undefined : parseInt(v))}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          {MESES.map((mes) => (
            <SelectItem key={mes.value} value={mes.value.toString()}>
              {mes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localValue.ano?.toString() || 'all'}
        onValueChange={(v) => handleChange('ano', v === 'all' ? undefined : parseInt(v))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os anos</SelectItem>
          {ANOS.map((ano) => (
            <SelectItem key={ano} value={ano.toString()}>
              {ano}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
