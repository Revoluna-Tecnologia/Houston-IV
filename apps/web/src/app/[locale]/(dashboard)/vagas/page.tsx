'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/houston';
import { useVagas, useHospitais, useTableSort, usePagination } from '@/hooks';
import {
  VagasFilters,
  VagasFiltersValue,
  VagasTable,
  VagaWithRelations,
  CreateVagaModal,
  EditVagaModal,
  VagaDetailsModal,
} from '@/components/vagas';
import type { QueryParams, CreateVagaDto, UpdateVagaDto } from '@/services/types';

const PlusIcon = () => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-12 w-12"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const MOCK_SETORES = [
  { id: '1', nome: 'UTI', hospitalId: '1' },
  { id: '2', nome: 'Emergencia', hospitalId: '1' },
  { id: '3', nome: 'Centro Cirurgico', hospitalId: '2' },
];

const MOCK_ESPECIALIDADES = [
  { id: '1', nome: 'Clinica Geral' },
  { id: '2', nome: 'Cardiologia' },
  { id: '3', nome: 'Pediatria' },
];

export default function VagasPage() {
  const t = useTranslations('Vagas');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<VagasFiltersValue>({
    status: 'all',
    hospitalId: 'all',
    setorId: 'all',
    dateRange: undefined,
    search: '',
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVaga, setSelectedVaga] = useState<VagaWithRelations | null>(null);

  const { sorting, onSort } = useTableSort();
  const { page, pageSize, setPage } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = {
      page,
      limit: pageSize,
    };

    if (sorting) {
      params.sortBy = sorting.id;
      params.sortOrder = sorting.direction || undefined;
    }

    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.hospitalId !== 'all') {
      params.hospitalId = filters.hospitalId;
    }

    if (filters.setorId !== 'all') {
      params.setorId = filters.setorId;
    }

    if (filters.dateRange?.from) {
      params.dataInicio = filters.dateRange.from.toISOString().split('T')[0];
    }

    if (filters.dateRange?.to) {
      params.dataFim = filters.dateRange.to.toISOString().split('T')[0];
    }

    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: vagas, meta, isLoading, create, update, remove } = useVagas(queryParams);
  const { data: hospitais, isLoading: isLoadingHospitais } = useHospitais({ limit: 100 });

  const vagasWithRelations: VagaWithRelations[] = useMemo(() => {
    return vagas.map((vaga) => {
      const hospital = hospitais.find((h) => h.id === vaga.hospitalId);
      const setor = MOCK_SETORES.find((s) => s.id === vaga.setorId);
      return {
        ...vaga,
        hospitalNome: hospital?.nome,
        setorNome: setor?.nome,
      };
    });
  }, [vagas, hospitais]);

  const handleView = useCallback((vaga: VagaWithRelations) => {
    setSelectedVaga(vaga);
    setDetailsModalOpen(true);
  }, []);

  const handleEdit = useCallback((vaga: VagaWithRelations) => {
    setSelectedVaga(vaga);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((vaga: VagaWithRelations) => {
    setSelectedVaga(vaga);
    setDeleteConfirmOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async (data: CreateVagaDto) => {
    await create(data);
  }, [create]);

  const handleEditSubmit = useCallback(async (id: string, data: UpdateVagaDto) => {
    await update(id, data);
  }, [update]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedVaga) {
      await remove(selectedVaga.id);
      setDeleteConfirmOpen(false);
      setSelectedVaga(null);
    }
  }, [selectedVaga, remove]);

  const handleCancelVaga = useCallback(async () => {
    if (selectedVaga) {
      await update(selectedVaga.id, { status: 'cancelada' } as unknown as UpdateVagaDto);
      setDetailsModalOpen(false);
      setSelectedVaga(null);
    }
  }, [selectedVaga, update]);

  const handleEditFromDetails = useCallback(() => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  }, []);

  if (isLoading || isLoadingHospitais) {
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

  const selectedHospital = selectedVaga
    ? hospitais.find((h) => h.id === selectedVaga.hospitalId)
    : null;
  const selectedSetor = selectedVaga
    ? MOCK_SETORES.find((s) => s.id === selectedVaga.setorId)
    : null;
  const selectedEspecialidade = selectedVaga
    ? MOCK_ESPECIALIDADES.find((e) => e.id === selectedVaga.especialidadeId)
    : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusIcon />
          {t('newVaga')}
        </Button>
      </div>

      <VagasFilters
        hospitals={hospitais}
        setores={MOCK_SETORES}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      {vagas.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon />}
          title={t('noVagas')}
          description={t('noVagasDescription')}
          action={{
            label: t('newVaga'),
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <VagasTable
          data={vagasWithRelations}
          hospitals={hospitais}
          sorting={sorting}
          onSort={onSort}
          pageIndex={page - 1}
          pageSize={pageSize}
          totalCount={meta.total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <CreateVagaModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateSubmit}
        hospitals={hospitais}
        setores={MOCK_SETORES}
        especialidades={MOCK_ESPECIALIDADES}
      />

      <EditVagaModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        vaga={selectedVaga}
        onSubmit={handleEditSubmit}
        hospitals={hospitais}
        setores={MOCK_SETORES}
        especialidades={MOCK_ESPECIALIDADES}
      />

      <VagaDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        vaga={selectedVaga}
        hospital={selectedHospital}
        setorNome={selectedSetor?.nome}
        especialidadeNome={selectedEspecialidade?.nome}
        candidaturas={[]}
        onEdit={handleEditFromDetails}
        onCancel={handleCancelVaga}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
