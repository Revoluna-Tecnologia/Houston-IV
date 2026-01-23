'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Medico, EscalistaStatus } from '../../services/types';

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

export interface EscalistasFiltersValue {
  grupoId: string;
  medicoId: string;
  status: EscalistaStatus | 'all';
  search: string;
}

export interface EscalistasFiltersProps {
  grupos: { id: string; nome: string }[];
  medicos: Medico[];
  value: EscalistasFiltersValue;
  onChange: (value: EscalistasFiltersValue) => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
];

export function EscalistasFilters({
  grupos,
  medicos,
  value,
  onChange,
  isLoading,
}: EscalistasFiltersProps) {
  const [localValue, setLocalValue] = useState<EscalistasFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (key: keyof EscalistasFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: EscalistasFiltersValue = {
      grupoId: 'all',
      medicoId: 'all',
      status: 'all',
      search: '',
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.grupoId !== 'all' ||
    localValue.medicoId !== 'all' ||
    localValue.status !== 'all' ||
    localValue.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <Select
        value={localValue.grupoId}
        onValueChange={(v) => handleChange('grupoId', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os grupos</SelectItem>
          {grupos.map((grupo) => (
            <SelectItem key={grupo.id} value={grupo.id}>
              {grupo.nome}
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
              {medico.nome} - {medico.crm}
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

      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </div>
        <Input
          placeholder="Buscar por nome, CRM..."
          value={localValue.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-9"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}>
          <XIcon />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
