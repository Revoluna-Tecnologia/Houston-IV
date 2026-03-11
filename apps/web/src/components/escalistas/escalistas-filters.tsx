'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Medico, EscalistaStatus } from '../../services/types';

const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);

export interface EscalistasFiltersValue { grupoId: string; medicoId: string; status: EscalistaStatus | 'all'; search: string; }
export interface EscalistasFiltersProps { grupos: { id: string; nome: string }[]; medicos: Medico[]; value: EscalistasFiltersValue; onChange: (value: EscalistasFiltersValue) => void; isLoading?: boolean; }

export function EscalistasFilters({ grupos, medicos, value, onChange, isLoading }: EscalistasFiltersProps) {
  const t = useTranslations('Escalistas.filters');
  const tStatus = useTranslations('Escalistas.statusLabels');
  const tCommon = useTranslations('Common.actions');
  const [localValue, setLocalValue] = useState<EscalistasFiltersValue>(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleChange = (key: keyof EscalistasFiltersValue, newValue: unknown) => { const updated = { ...localValue, [key]: newValue }; setLocalValue(updated); onChange(updated); };
  const handleClear = () => { const cleared: EscalistasFiltersValue = { grupoId: 'all', medicoId: 'all', status: 'all', search: '' }; setLocalValue(cleared); onChange(cleared); };
  const hasFilters = localValue.grupoId !== 'all' || localValue.medicoId !== 'all' || localValue.status !== 'all' || localValue.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4">
      <Select value={localValue.grupoId} onValueChange={(v) => handleChange('grupoId', v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('group')} /></SelectTrigger>
        <SelectContent><SelectItem value="all">{t('allGroups')}</SelectItem>{grupos.map((g) => (<SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>))}</SelectContent>
      </Select>
      <Select value={localValue.medicoId} onValueChange={(v) => handleChange('medicoId', v)}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('medico')} /></SelectTrigger>
        <SelectContent><SelectItem value="all">{t('allMedicos')}</SelectItem>{medicos.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome} - {m.crm}</SelectItem>))}</SelectContent>
      </Select>
      <Select value={localValue.status} onValueChange={(v) => handleChange('status', v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('status')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{useTranslations('Common.status')('all')}</SelectItem>
          <SelectItem value="pendente">{tStatus('allPending')}</SelectItem>
          <SelectItem value="ativo">{tStatus('active')}</SelectItem>
          <SelectItem value="inativo">{tStatus('inactive')}</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative flex-1 min-w-[200px]"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div><Input placeholder={t('searchPlaceholder')} value={localValue.search} onChange={(e) => handleChange('search', e.target.value)} className="pl-9" /></div>
      {hasFilters && (<Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading}><XIcon />{tCommon('clearFilters')}</Button>)}
    </div>
  );
}
