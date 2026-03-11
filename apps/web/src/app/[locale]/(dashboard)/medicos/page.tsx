'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/houston';
import { useMedicos, useTableSort, usePagination } from '@/hooks';
import {
  MedicosFilters, MedicosFiltersValue, MedicosTable, MedicoWithRelations,
} from '@/components/medicos';
import type { QueryParams, CreateMedicoDto, UpdateMedicoDto, Especialidade } from '@/services/types';

const MedicoDetailsModal = dynamic(() => import('@/components/medicos').then(mod => ({ default: mod.MedicoDetailsModal })), { ssr: false });
const CreateMedicoModal = dynamic(() => import('@/components/medicos').then(mod => ({ default: mod.CreateMedicoModal })), { ssr: false });
const EditMedicoModal = dynamic(() => import('@/components/medicos').then(mod => ({ default: mod.EditMedicoModal })), { ssr: false });

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const MOCK_ESPECIALIDADES: Especialidade[] = [
  { id: '1', nome: 'Clinica Geral', sigla: 'CG', cor: '#3B82F6', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nome: 'Cardiologia', sigla: 'CARD', cor: '#EF4444', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', nome: 'Pediatria', sigla: 'PED', cor: '#10B981', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', nome: 'Ortopedia', sigla: 'ORT', cor: '#F59E0B', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', nome: 'Neurologia', sigla: 'NEURO', cor: '#8B5CF6', ativo: true, createdAt: new Date(), updatedAt: new Date() },
];

export default function MedicosPage() {
  const t = useTranslations('Medicos');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<MedicosFiltersValue>({ search: '', especialidadeId: 'all', status: 'all' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<MedicoWithRelations | null>(null);

  const { sorting, onSort } = useTableSort();
  const { page, pageSize, setPage } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = { page, limit: pageSize };
    if (sorting) { params.sortBy = sorting.id; params.sortOrder = sorting.direction || undefined; }
    if (filters.search) params.search = filters.search;
    if (filters.especialidadeId !== 'all') params.especialidadeId = filters.especialidadeId;
    if (filters.status !== 'all') params.ativo = filters.status === 'ativo';
    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: medicos, meta, isLoading, create, update, remove } = useMedicos(queryParams);

  const medicosWithRelations: MedicoWithRelations[] = useMemo(() => {
    return medicos.map((medico) => {
      const especialidade = MOCK_ESPECIALIDADES.find((e) => e.id === medico.especialidadeId);
      return { ...medico, especialidadeNome: especialidade?.nome };
    });
  }, [medicos]);

  const handleView = useCallback((medico: MedicoWithRelations) => { setSelectedMedico(medico); setDetailsModalOpen(true); }, []);
  const handleEdit = useCallback((medico: MedicoWithRelations) => { setSelectedMedico(medico); setEditModalOpen(true); }, []);
  const handleDelete = useCallback((medico: MedicoWithRelations) => { setSelectedMedico(medico); setDeleteConfirmOpen(true); }, []);
  const handleCreateSubmit = useCallback(async (data: CreateMedicoDto) => { await create(data); }, [create]);
  const handleEditSubmit = useCallback(async (id: string, data: UpdateMedicoDto) => { await update(id, data); }, [update]);
  const handleDeleteConfirm = useCallback(async () => {
    if (selectedMedico) { await remove(selectedMedico.id); setDeleteConfirmOpen(false); setSelectedMedico(null); }
  }, [selectedMedico, remove]);
  const handleEditFromDetails = useCallback(() => { setDetailsModalOpen(false); setEditModalOpen(true); }, []);
  const handleDeleteFromDetails = useCallback(() => { setDetailsModalOpen(false); setDeleteConfirmOpen(true); }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const selectedEspecialidade = selectedMedico ? MOCK_ESPECIALIDADES.find((e) => e.id === selectedMedico.especialidadeId) : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setCreateModalOpen(true)}><PlusIcon />{t('newMedico')}</Button>
      </div>

      <MedicosFilters especialidades={MOCK_ESPECIALIDADES} value={filters} onChange={setFilters} isLoading={isLoading} />

      {medicos.length === 0 ? (
        <EmptyState icon={<UserIcon />} title={t('noMedicos')} description={t('noMedicosDescription')}
          action={{ label: t('newMedico'), onClick: () => setCreateModalOpen(true) }} />
      ) : (
        <MedicosTable data={medicosWithRelations} especialidades={MOCK_ESPECIALIDADES} sorting={sorting} onSort={onSort}
          pageIndex={page - 1} pageSize={pageSize} totalCount={meta.total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <CreateMedicoModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSubmit={handleCreateSubmit} especialidades={MOCK_ESPECIALIDADES} />
      <EditMedicoModal open={editModalOpen} onOpenChange={setEditModalOpen} medico={selectedMedico} onSubmit={handleEditSubmit} especialidades={MOCK_ESPECIALIDADES} />
      <MedicoDetailsModal open={detailsModalOpen} onOpenChange={setDetailsModalOpen} medico={selectedMedico}
        especialidade={selectedEspecialidade} escalistas={[]} candidaturas={[]} onEdit={handleEditFromDetails} onDelete={handleDeleteFromDetails} />

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}
        title={t('deleteTitle')} description={t('deleteDescription')}
        confirmText={tCommon('delete')} cancelText={tCommon('cancel')} variant="destructive" onConfirm={handleDeleteConfirm} />
    </div>
  );
}
