'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog, BulkActionsBar } from '@/components/houston';
import { useMedicos, useTableSort, usePagination } from '@/hooks';
import { useEscalistas } from '@/hooks/use-escalistas';
import { EscalistasFilters, EscalistasFiltersValue, EscalistasTable, EscalistaWithRelations } from '@/components/escalistas';
import type { QueryParams } from '@/services/types';

const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12" /></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);

const MOCK_GRUPOS = [{ id: '1', nome: 'Grupo A' }, { id: '2', nome: 'Grupo B' }, { id: '3', nome: 'Grupo C' }];

export default function EscalistasPage() {
  const t = useTranslations('Escalistas');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<EscalistasFiltersValue>({ grupoId: 'all', medicoId: 'all', status: 'all', search: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEscalista, setSelectedEscalista] = useState<EscalistaWithRelations | null>(null);
  const { sorting, onSort } = useTableSort();
  const { page, pageSize, setPage } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = { page, limit: pageSize };
    if (sorting) { params.sortBy = sorting.id; params.sortOrder = sorting.direction || undefined; }
    if (filters.grupoId !== 'all') params.grupoId = filters.grupoId;
    if (filters.medicoId !== 'all') params.medicoId = filters.medicoId;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: escalistas, meta, isLoading, remove, ativar, inativar, bulkAtivar, bulkInativar } = useEscalistas(queryParams);
  const { data: medicos, isLoading: isLoadingMedicos } = useMedicos({ limit: 100 });

  const escalistasWithRelations: EscalistaWithRelations[] = useMemo(() => escalistas.map((e) => {
    const medico = medicos.find((m) => m.id === e.medicoId);
    const grupo = MOCK_GRUPOS.find((g) => g.id === e.grupoId);
    return { ...e, medicoNome: medico?.nome, medicoCrm: medico?.crm, grupoNome: grupo?.nome };
  }), [escalistas, medicos]);

  const handleAtivar = useCallback(async (e: EscalistaWithRelations) => { await ativar(e.id); }, [ativar]);
  const handleInativar = useCallback(async (e: EscalistaWithRelations) => { await inativar(e.id); }, [inativar]);
  const handleRemove = useCallback((e: EscalistaWithRelations) => { setSelectedEscalista(e); setDeleteConfirmOpen(true); }, []);
  const handleDeleteConfirm = useCallback(async () => { if (selectedEscalista) { await remove(selectedEscalista.id); setDeleteConfirmOpen(false); setSelectedEscalista(null); } }, [selectedEscalista, remove]);
  const handleBulkAtivar = useCallback(async () => { await bulkAtivar(selectedIds); setSelectedIds([]); }, [selectedIds, bulkAtivar]);
  const handleBulkInativar = useCallback(async () => { await bulkInativar(selectedIds); setSelectedIds([]); }, [selectedIds, bulkInativar]);

  if (isLoading || isLoadingMedicos) {
    return (<div className="space-y-6 p-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t('title')}</h1></div><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t('title')}</h1></div>
      <EscalistasFilters grupos={MOCK_GRUPOS} medicos={medicos} value={filters} onChange={setFilters} isLoading={isLoading} />
      {escalistas.length === 0 ? (
        <EmptyState icon={<UsersIcon />} title={t('noEscalistas')} description={t('noEscalistasDescription')} />
      ) : (
        <EscalistasTable data={escalistasWithRelations} sorting={sorting} onSort={onSort} pageIndex={page - 1} pageSize={pageSize} totalCount={meta.total} onPageChange={(pi) => setPage(pi + 1)} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onAtivar={handleAtivar} onInativar={handleInativar} onRemove={handleRemove} />
      )}
      <BulkActionsBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <Button size="sm" onClick={handleBulkAtivar}><CheckIcon />{tCommon('activate')}</Button>
        <Button size="sm" variant="outline" onClick={handleBulkInativar}><XIcon />{tCommon('deactivate')}</Button>
      </BulkActionsBar>
      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title={t('removeTitle')} description={t('removeDescription')} confirmText={tCommon('remove')} cancelText={tCommon('cancel')} variant="destructive" onConfirm={handleDeleteConfirm} />
    </div>
  );
}
