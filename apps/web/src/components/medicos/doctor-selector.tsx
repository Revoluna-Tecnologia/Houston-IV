'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Medico } from '../../services/types';

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

const CheckIcon = () => (
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
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface DoctorSelectorProps {
  medicos: Medico[];
  value: string | null;
  onChange: (medicoId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function DoctorSelector({
  medicos,
  value,
  onChange,
  placeholder = 'Selecione um medico',
  disabled = false,
  isLoading = false,
  className,
}: DoctorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMedico = useMemo(() => {
    return medicos.find((m) => m.id === value);
  }, [medicos, value]);

  const filteredMedicos = useMemo(() => {
    if (!searchQuery) return medicos;

    const query = searchQuery.toLowerCase();
    return medicos.filter(
      (medico) =>
        medico.nome.toLowerCase().includes(query) ||
        medico.crm.toLowerCase().includes(query)
    );
  }, [medicos, searchQuery]);

  const handleSelect = useCallback(
    (medicoId: string) => {
      onChange(medicoId === value ? null : medicoId);
      setOpen(false);
      setSearchQuery('');
    },
    [onChange, value]
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={`w-full justify-between ${className}`}
        >
          {isLoading ? (
            <span className="text-gray-400">Carregando...</span>
          ) : selectedMedico ? (
            <span className="truncate">
              {selectedMedico.nome} - {selectedMedico.crm}/{selectedMedico.crmUf}
            </span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <Input
              placeholder="Buscar por nome ou CRM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredMedicos.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhum medico encontrado
            </div>
          ) : (
            filteredMedicos.map((medico) => (
              <button
                key={medico.id}
                onClick={() => handleSelect(medico.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{medico.nome}</span>
                  <span className="text-sm text-gray-500">
                    CRM {medico.crm}/{medico.crmUf}
                  </span>
                </div>
                {value === medico.id && (
                  <span className="text-primary-500">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
