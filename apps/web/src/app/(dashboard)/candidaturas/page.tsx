'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, BulkActionsBar, ConfirmDialog } from '@/components/houston';
import { useCandidaturas, useVagas, useMedicos, useHospitais, useTableSort, usePagination } from '../../../hooks';
import {
  CandidaturasFilters,
  CandidaturasFiltersValue,
  CandidaturasTable,
  CandidaturaWithRelations,
} from '../../../components/candidaturas';
import type { QueryParams } from '../../../services/types';

const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const MOCK_SETORES = [
  { id: '1', nome: 'UTI', hospitalId: '1' },
  { id: '2', nome: 'Emergencia', hospitalId: '1' },
  { id: '3', nome: 'Centro Cirurgico', hospitalId: '2' },
];

export default function CandidaturasPage() {
  const [filters, setFilters] = useState<CandidaturasFiltersValue>({
    status: 'all',
    vagaId: 'all',
    medicoId: 'all',
    dateRange: undefined,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [_detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'aprovar' | 'rejeitar' | 'aprovar-bulk' | 'rejeitar-bulk'>('aprovar');
  const [selectedCandidatura, setSelectedCandidatura] = useState<CandidaturaWithRelations | null>(null);

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

    if (filters.vagaId !== 'all') {
      params.vagaId = filters.vagaId;
    }

    if (filters.medicoId !== 'all') {
      params.medicoId = filters.medicoId;
    }

    if (filters.dateRange?.from) {
      params.dataInicio = filters.dateRange.from.toISOString().split('T')[0];
    }

    if (filters.dateRange?.to) {
      params.dataFim = filters.dateRange.to.toISOString().split('T')[0];
    }

    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: candidaturas, meta, isLoading, aprovar, rejeitar } = useCandidaturas(queryParams);
  const { data: vagas, isLoading: isLoadingVagas } = useVagas({ limit: 200 }); // Aumentado para garantir que pegue todas
  const { data: medicos, isLoading: isLoadingMedicos } = useMedicos({ limit: 200 });
  const { data: hospitais, isLoading: isLoadingHospitais } = useHospitais({ limit: 50 });

  // Criar Maps para lookup O(1) em vez de find() O(n)
  const vagasMap = useMemo(() => new Map(vagas.map(v => [v.id, v])), [vagas]);
  const medicosMap = useMemo(() => new Map(medicos.map(m => [m.id, m])), [medicos]);
  const hospitaisMap = useMemo(() => new Map(hospitais.map(h => [h.id, h])), [hospitais]);
  const setoresMap = useMemo(() => new Map(MOCK_SETORES.map(s => [s.id, s])), []);

  const candidaturasWithRelations: CandidaturaWithRelations[] = useMemo(() => {
    return candidaturas.map((candidatura) => {
      const vaga = vagasMap.get(candidatura.vagaId);
      const medico = medicosMap.get(candidatura.medicoId);
      const hospital = vaga ? hospitaisMap.get(vaga.hospitalId) : null;
      const setor = vaga ? setoresMap.get(vaga.setorId) : null;

      return {
        ...candidatura,
        vaga,
        medico,
        hospital: hospital || undefined,
        hospitalNome: hospital?.nome,
        setorNome: setor?.nome,
        medicoNome: medico?.nome,
        medicoCrm: medico?.crm,
      };
    });
  }, [candidaturas, vagasMap, medicosMap, hospitaisMap, setoresMap]);

  const handleView = useCallback((candidatura: CandidaturaWithRelations) => {
    setSelectedCandidatura(candidatura);
    setDetailsModalOpen(true);
  }, []);

  const handleAprovar = useCallback((candidatura: CandidaturaWithRelations) => {
    setSelectedCandidatura(candidatura);
    setConfirmAction('aprovar');
    setConfirmDialogOpen(true);
  }, []);

  const handleRejeitar = useCallback((candidatura: CandidaturaWithRelations) => {
    setSelectedCandidatura(candidatura);
    setConfirmAction('rejeitar');
    setConfirmDialogOpen(true);
  }, []);

  const handleBulkAprovar = useCallback(() => {
    setConfirmAction('aprovar-bulk');
    setConfirmDialogOpen(true);
  }, []);

  const handleBulkRejeitar = useCallback(() => {
    setConfirmAction('rejeitar-bulk');
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmAction === 'aprovar' && selectedCandidatura) {
      await aprovar(selectedCandidatura.id);
    } else if (confirmAction === 'rejeitar' && selectedCandidatura) {
      await rejeitar(selectedCandidatura.id);
    } else if (confirmAction === 'aprovar-bulk') {
      for (const id of selectedIds) {
        await aprovar(id);
      }
      setSelectedIds([]);
    } else if (confirmAction === 'rejeitar-bulk') {
      for (const id of selectedIds) {
        await rejeitar(id);
      }
      setSelectedIds([]);
    }

    setConfirmDialogOpen(false);
    setSelectedCandidatura(null);
  }, [confirmAction, selectedCandidatura, selectedIds, aprovar, rejeitar]);

  const getConfirmDialogContent = () => {
    switch (confirmAction) {
      case 'aprovar':
        return {
          title: 'Aprovar Candidatura',
          description: 'Tem certeza que deseja aprovar esta candidatura?',
          confirmText: 'Aprovar',
        };
      case 'rejeitar':
        return {
          title: 'Rejeitar Candidatura',
          description: 'Tem certeza que deseja rejeitar esta candidatura?',
          confirmText: 'Rejeitar',
        };
      case 'aprovar-bulk':
        return {
          title: 'Aprovar Candidaturas',
          description: `Tem certeza que deseja aprovar ${selectedIds.length} candidatura(s)?`,
          confirmText: 'Aprovar Todas',
        };
      case 'rejeitar-bulk':
        return {
          title: 'Rejeitar Candidaturas',
          description: `Tem certeza que deseja rejeitar ${selectedIds.length} candidatura(s)?`,
          confirmText: 'Rejeitar Todas',
        };
    }
  };

  const dialogContent = getConfirmDialogContent();

  if (isLoading || isLoadingVagas || isLoadingMedicos || isLoadingHospitais) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Candidaturas</h1>
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Candidaturas</h1>
      </div>

      <CandidaturasFilters
        vagas={vagas}
        medicos={medicos}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      {candidaturas.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhuma candidatura encontrada"
          description="Nao ha candidaturas para exibir. Ajuste os filtros ou aguarde novas candidaturas."
        />
      ) : (
        <CandidaturasTable
          data={candidaturasWithRelations}
          sorting={sorting}
          onSort={onSort}
          pageIndex={page - 1}
          pageSize={pageSize}
          totalCount={meta.total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onAprovar={handleAprovar}
          onRejeitar={handleRejeitar}
          onView={handleView}
        />
      )}

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
      >
        <Button
          size="sm"
          onClick={handleBulkAprovar}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckIcon />
          Aprovar Selecionados
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleBulkRejeitar}
        >
          <XIcon />
          Rejeitar Selecionados
        </Button>
      </BulkActionsBar>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={dialogContent.title}
        description={dialogContent.description}
        confirmText={dialogContent.confirmText}
        cancelText="Cancelar"
        variant={confirmAction.includes('rejeitar') ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
