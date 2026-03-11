'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/houston';
import { useHospitais, useTableSort, usePagination } from '@/hooks';
import { HospitaisFilters, HospitaisFiltersValue, HospitaisTable, HospitalWithRelations, CreateHospitalModal, EditHospitalModal, HospitalDetailsModal } from '@/components/hospitais';
import type { QueryParams, CreateHospitalDto, UpdateHospitalDto } from '@/services/types';

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const BuildingIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>);

const MOCK_GRUPOS = [{ id: '1', nome: 'Grupo A' }, { id: '2', nome: 'Grupo B' }, { id: '3', nome: 'Grupo C' }];

export default function HospitaisPage() {
  const t = useTranslations('Hospitais');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<HospitaisFiltersValue>({ grupoId: 'all', cidade: '', status: 'all', search: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithRelations | null>(null);
  const { sorting, onSort } = useTableSort();
  const { page, pageSize, setPage } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = { page, limit: pageSize };
    if (sorting) { params.sortBy = sorting.id; params.sortOrder = sorting.direction || undefined; }
    if (filters.grupoId !== 'all') params.grupoId = filters.grupoId;
    if (filters.cidade) params.cidade = filters.cidade;
    if (filters.status !== 'all') params.ativo = filters.status === 'ativo';
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: hospitais, meta, isLoading, create, update, remove } = useHospitais(queryParams);
  const hospitaisWithRelations: HospitalWithRelations[] = useMemo(() => hospitais.map((hospital) => ({ ...hospital, grupoNome: MOCK_GRUPOS.find((g) => g.id === hospital.grupoId)?.nome })), [hospitais]);

  const handleView = useCallback((h: HospitalWithRelations) => { setSelectedHospital(h); setDetailsModalOpen(true); }, []);
  const handleEdit = useCallback((h: HospitalWithRelations) => { setSelectedHospital(h); setEditModalOpen(true); }, []);
  const handleDelete = useCallback((h: HospitalWithRelations) => { setSelectedHospital(h); setDeleteConfirmOpen(true); }, []);
  const handleViewSetores = useCallback((_h: HospitalWithRelations) => {}, []);
  const handleCreateSubmit = useCallback(async (data: CreateHospitalDto) => { await create(data); }, [create]);
  const handleEditSubmit = useCallback(async (id: string, data: UpdateHospitalDto) => { await update(id, data); }, [update]);
  const handleDeleteConfirm = useCallback(async () => { if (selectedHospital) { await remove(selectedHospital.id); setDeleteConfirmOpen(false); setSelectedHospital(null); } }, [selectedHospital, remove]);
  const handleEditFromDetails = useCallback(() => { setDetailsModalOpen(false); setEditModalOpen(true); }, []);

  if (isLoading) {
    return (<div className="space-y-6 p-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t('title')}</h1><Skeleton className="h-10 w-32" /></div><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t('title')}</h1><Button onClick={() => setCreateModalOpen(true)}><PlusIcon />{t('newHospital')}</Button></div>
      <HospitaisFilters grupos={MOCK_GRUPOS} value={filters} onChange={setFilters} isLoading={isLoading} />
      {hospitais.length === 0 ? (
        <EmptyState icon={<BuildingIcon />} title={t('noHospitais')} description={t('noHospitaisDescription')} action={{ label: t('newHospital'), onClick: () => setCreateModalOpen(true) }} />
      ) : (
        <HospitaisTable data={hospitaisWithRelations} sorting={sorting} onSort={onSort} pageIndex={page - 1} pageSize={pageSize} totalCount={meta.total} onPageChange={(pi) => setPage(pi + 1)} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onViewSetores={handleViewSetores} />
      )}
      <CreateHospitalModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSubmit={handleCreateSubmit} grupos={MOCK_GRUPOS} />
      <EditHospitalModal open={editModalOpen} onOpenChange={setEditModalOpen} hospital={selectedHospital} onSubmit={handleEditSubmit} grupos={MOCK_GRUPOS} />
      <HospitalDetailsModal open={detailsModalOpen} onOpenChange={setDetailsModalOpen} hospital={selectedHospital} grupoNome={selectedHospital ? MOCK_GRUPOS.find((g) => g.id === selectedHospital.grupoId)?.nome : undefined} onEdit={handleEditFromDetails} />
      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title={t('deleteTitle')} description={t('deleteDescription')} confirmText={tCommon('delete')} cancelText={tCommon('cancel')} variant="destructive" onConfirm={handleDeleteConfirm} />
    </div>
  );
}
