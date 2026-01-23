'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Hospital } from '../../services/types';

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

export interface HospitalSelectorProps {
  hospitals: Hospital[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function HospitalSelector({
  hospitals,
  value,
  onValueChange,
  placeholder = 'Selecione o hospital',
  disabled,
  className,
}: HospitalSelectorProps) {
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

  const selectedHospital = hospitals.find((h) => h.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedHospital && (
            <span>
              {selectedHospital.nome}
              {selectedHospital.cidade && (
                <span className="text-gray-500"> - {selectedHospital.cidade}</span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <Input
              placeholder="Buscar hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredHospitals.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              Nenhum hospital encontrado
            </div>
          ) : (
            filteredHospitals.map((hospital) => (
              <SelectItem key={hospital.id} value={hospital.id}>
                <div className="flex flex-col">
                  <span>{hospital.nome}</span>
                  {hospital.cidade && (
                    <span className="text-xs text-gray-500">{hospital.cidade}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
