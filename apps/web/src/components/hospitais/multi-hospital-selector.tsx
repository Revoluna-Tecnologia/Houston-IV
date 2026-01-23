'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Hospital } from '../../services/types';

const ChevronDownIcon = () => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

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

export interface MultiHospitalSelectorProps {
  hospitals: Hospital[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiHospitalSelector({
  hospitals,
  value,
  onValueChange,
  placeholder = 'Selecione os hospitais',
  disabled,
  className,
}: MultiHospitalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHospitals = useMemo(() => {
    if (!searchTerm) return hospitals;
    const term = searchTerm.toLowerCase();
    return hospitals.filter(
      (h) =>
        h.nome.toLowerCase().includes(term) ||
        (h.cidade && h.cidade.toLowerCase().includes(term))
    );
  }, [hospitals, searchTerm]);

  const handleToggle = (hospitalId: string) => {
    if (value.includes(hospitalId)) {
      onValueChange(value.filter((id) => id !== hospitalId));
    } else {
      onValueChange([...value, hospitalId]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === hospitals.length) {
      onValueChange([]);
    } else {
      onValueChange(hospitals.map((h) => h.id));
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const hospital = hospitals.find((h) => h.id === value[0]);
      return hospital?.nome || placeholder;
    }
    if (value.length === hospitals.length) return 'Todos os hospitais';
    return `${value.length} hospitais selecionados`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`justify-between ${className}`}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <Input
              placeholder="Buscar hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="p-2 border-b">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={value.length === hospitals.length && hospitals.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">Selecionar todos</span>
          </label>
        </div>

        <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
          {filteredHospitals.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              Nenhum hospital encontrado
            </div>
          ) : (
            filteredHospitals.map((hospital) => (
              <label
                key={hospital.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <Checkbox
                  checked={value.includes(hospital.id)}
                  onCheckedChange={() => handleToggle(hospital.id)}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{hospital.nome}</span>
                  {hospital.cidade && (
                    <span className="text-xs text-gray-500">{hospital.cidade}</span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {value.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onValueChange([])}
            >
              Limpar selecao
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
