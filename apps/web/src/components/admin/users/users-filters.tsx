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
import type { UserRole } from '@/services/types';

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

export interface UsersFiltersValue {
  role: UserRole | 'all';
  grupoId: string;
  status: 'all' | 'ativo' | 'inativo';
  search: string;
}

export interface UsersFiltersProps {
  grupos: { id: string; nome: string }[];
  value: UsersFiltersValue;
  onChange: (value: UsersFiltersValue) => void;
  isLoading?: boolean;
}

export function UsersFilters({
  grupos,
  value,
  onChange,
  isLoading,
}: UsersFiltersProps) {
  const t = useTranslations('Admin.users.filters');
  const tRoles = useTranslations('Common.roles');
  const tStatus = useTranslations('Common.status');
  const tCommon = useTranslations('Common.actions');
  const [localValue, setLocalValue] = useState<UsersFiltersValue>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (key: keyof UsersFiltersValue, newValue: unknown) => {
    const updated = { ...localValue, [key]: newValue };
    setLocalValue(updated);
    onChange(updated);
  };

  const handleClear = () => {
    const cleared: UsersFiltersValue = {
      role: 'all',
      grupoId: 'all',
      status: 'all',
      search: '',
    };
    setLocalValue(cleared);
    onChange(cleared);
  };

  const hasFilters =
    localValue.role !== 'all' ||
    localValue.grupoId !== 'all' ||
    localValue.status !== 'all' ||
    localValue.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <Select
        value={localValue.role}
        onValueChange={(v) => handleChange('role', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('role')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tRoles('allRoles')}</SelectItem>
          <SelectItem value="administrador">{tRoles('administrator')}</SelectItem>
          <SelectItem value="moderador">{tRoles('moderator')}</SelectItem>
          <SelectItem value="gestor">{tRoles('manager')}</SelectItem>
          <SelectItem value="coordenador">{tRoles('coordinator')}</SelectItem>
          <SelectItem value="escalista">{tRoles('scheduler')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localValue.grupoId}
        onValueChange={(v) => handleChange('grupoId', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('group')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allGroups')}</SelectItem>
          {grupos.map((grupo) => (
            <SelectItem key={grupo.id} value={grupo.id}>
              {grupo.nome}
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
          <SelectItem value="all">{tStatus('all')}</SelectItem>
          <SelectItem value="ativo">{tStatus('active')}</SelectItem>
          <SelectItem value="inativo">{tStatus('inactive')}</SelectItem>
        </SelectContent>
      </Select>

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
