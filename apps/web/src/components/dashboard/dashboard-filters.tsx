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
import { MonthPicker } from '@/components/houston';
import type { Hospital } from '../../services/types';

export interface DashboardFiltersValue {
  month: Date | undefined;
  hospitalIds: string[];
}

export interface DashboardFiltersProps {
  hospitals: Hospital[];
  value: DashboardFiltersValue;
  onChange: (value: DashboardFiltersValue) => void;
  isLoading?: boolean;
}

export function DashboardFilters({
  hospitals,
  value,
  onChange,
  isLoading,
}: DashboardFiltersProps) {
  const [localMonth, setLocalMonth] = useState<Date | undefined>(value.month);
  const [localHospitalId, setLocalHospitalId] = useState<string>(
    value.hospitalIds.length > 0 ? value.hospitalIds[0] : 'all'
  );

  useEffect(() => {
    setLocalMonth(value.month);
    setLocalHospitalId(value.hospitalIds.length > 0 ? value.hospitalIds[0] : 'all');
  }, [value]);

  const handleApply = () => {
    onChange({
      month: localMonth,
      hospitalIds: localHospitalId === 'all' ? [] : [localHospitalId],
    });
  };

  const handleReset = () => {
    const now = new Date();
    setLocalMonth(now);
    setLocalHospitalId('all');
    onChange({
      month: now,
      hospitalIds: [],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Periodo:</span>
        <MonthPicker
          value={localMonth}
          onChange={setLocalMonth}
          placeholder="Selecione o mes"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Hospital:</span>
        <Select value={localHospitalId} onValueChange={setLocalHospitalId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os hospitais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os hospitais</SelectItem>
            {hospitals.map((hospital) => (
              <SelectItem key={hospital.id} value={hospital.id}>
                {hospital.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Limpar
        </Button>
        <Button onClick={handleApply} disabled={isLoading}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}
