'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/houston';
import { useGrades, useHospitais, useTableSort, usePagination } from '@/hooks';
import {
  GradesFilters,
  GradesFiltersValue,
  GradeCard,
  GradeWithRelations,
  CreateGradeModal,
  EditGradeModal,
  GenerateVagasModal,
} from '@/components/grades';
import type { QueryParams, CreateGradeDto, UpdateGradeDto } from '@/services/types';

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

const CalendarIcon = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

export default function GradesPage() {
  const t = useTranslations('Grades');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<GradesFiltersValue>({
    hospitalId: 'all',
    setorId: 'all',
    status: 'all',
    mes: undefined,
    ano: undefined,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [generateVagasModalOpen, setGenerateVagasModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeWithRelations | null>(null);

  const { sorting } = useTableSort();
  const { page, pageSize } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = {
      page,
      limit: pageSize,
    };

    if (sorting) {
      params.sortBy = sorting.id;
      params.sortOrder = sorting.direction || undefined;
    }

    if (filters.hospitalId !== 'all') {
      params.hospitalId = filters.hospitalId;
    }

    if (filters.setorId !== 'all') {
      params.setorId = filters.setorId;
    }

    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.mes) {
      params.mes = filters.mes;
    }

    if (filters.ano) {
      params.ano = filters.ano;
    }

    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: grades, isLoading, create, update, remove, publish, generateVagas } = useGrades(queryParams);
  const { data: hospitais, isLoading: isLoadingHospitais } = useHospitais({ limit: 100 });

  const gradesWithRelations: GradeWithRelations[] = useMemo(() => {
    return grades.map((grade) => {
      const hospital = hospitais.find((h) => h.id === grade.hospitalId);
      const setor = MOCK_SETORES.find((s) => s.id === grade.setorId);
      return {
        ...grade,
        hospitalNome: hospital?.nome,
        setorNome: setor?.nome,
        slotsPreenchidos: Math.floor(Math.random() * 100),
        totalSlots: 100,
      };
    });
  }, [grades, hospitais]);

  const handleView = useCallback((grade: GradeWithRelations) => {
    setSelectedGrade(grade);
    // TODO: Implement navigation to grade details page
    // Example: router.push(`/grades/${grade.id}`)
  }, []);

  const handleEdit = useCallback((grade: GradeWithRelations) => {
    setSelectedGrade(grade);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((grade: GradeWithRelations) => {
    setSelectedGrade(grade);
    setDeleteConfirmOpen(true);
  }, []);

  const handlePublish = useCallback((grade: GradeWithRelations) => {
    setSelectedGrade(grade);
    setPublishConfirmOpen(true);
  }, []);

  const handleGenerateVagas = useCallback((grade: GradeWithRelations) => {
    setSelectedGrade(grade);
    setGenerateVagasModalOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async (data: CreateGradeDto) => {
    await create(data);
  }, [create]);

  const handleEditSubmit = useCallback(async (id: string, data: UpdateGradeDto) => {
    await update(id, data);
  }, [update]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedGrade) {
      await remove(selectedGrade.id);
      setDeleteConfirmOpen(false);
      setSelectedGrade(null);
    }
  }, [selectedGrade, remove]);

  const handlePublishConfirm = useCallback(async () => {
    if (selectedGrade) {
      await publish(selectedGrade.id);
      setPublishConfirmOpen(false);
      setSelectedGrade(null);
    }
  }, [selectedGrade, publish]);

  const handleGenerateVagasConfirm = useCallback(async (_especialidadeId: string, _valor: number) => {
    if (selectedGrade) {
      await generateVagas(selectedGrade.id);
      setGenerateVagasModalOpen(false);
      setSelectedGrade(null);
    }
  }, [selectedGrade, generateVagas]);

  const filteredSetores = filters.hospitalId && filters.hospitalId !== 'all'
    ? MOCK_SETORES.filter((s) => s.hospitalId === filters.hospitalId)
    : MOCK_SETORES;

  if (isLoading || isLoadingHospitais) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusIcon />
          {t('newGrade')}
        </Button>
      </div>

      <GradesFilters
        hospitais={hospitais}
        setores={filteredSetores}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      {grades.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title={t('noGrades')}
          description={t('noGradesDescription')}
          action={{
            label: t('newGrade'),
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gradesWithRelations.map((grade) => (
            <GradeCard
              key={grade.id}
              grade={grade}
              onView={handleView}
              onEdit={handleEdit}
              onPublish={handlePublish}
              onGenerateVagas={handleGenerateVagas}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateGradeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateSubmit}
        hospitais={hospitais}
        setores={MOCK_SETORES}
      />

      <EditGradeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        grade={selectedGrade}
        onSubmit={handleEditSubmit}
        hospitais={hospitais}
        setores={MOCK_SETORES}
      />

      <GenerateVagasModal
        open={generateVagasModalOpen}
        onOpenChange={setGenerateVagasModalOpen}
        grade={selectedGrade}
        especialidades={MOCK_ESPECIALIDADES}
        onConfirm={handleGenerateVagasConfirm}
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

      <ConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title={t('publishTitle')}
        description={t('publishDescription')}
        confirmText={tCommon('publish')}
        cancelText={tCommon('cancel')}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
}
