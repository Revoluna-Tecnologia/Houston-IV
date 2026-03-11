'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, BulkActionsBar } from '@/components/houston';
import { usePagamentos, useMedicos, useHospitais, useTableSort, usePagination } from '@/hooks';
import {
  PagamentosFilters,
  PagamentosFiltersValue,
  PagamentosTable,
  PagamentoWithRelations,
} from '@/components/pagamentos';
import type { QueryParams } from '@/services/types';

const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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

const WalletIcon = () => (
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
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

export default function PagamentosPage() {
  const t = useTranslations('Pagamentos');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<PagamentosFiltersValue>({
    status: 'all',
    medicoId: 'all',
    hospitalId: 'all',
    dateRange: undefined,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

    if (filters.medicoId !== 'all') {
      params.medicoId = filters.medicoId;
    }

    if (filters.hospitalId !== 'all') {
      params.hospitalId = filters.hospitalId;
    }

    if (filters.dateRange?.from) {
      params.dataInicio = filters.dateRange.from.toISOString().split('T')[0];
    }

    if (filters.dateRange?.to) {
      params.dataFim = filters.dateRange.to.toISOString().split('T')[0];
    }

    return params;
  }, [filters, sorting, page, pageSize]);

  const {
    data: pagamentos,
    meta,
    isLoading,
    autorizar,
    pagar,
    bulkAutorizar,
    bulkPagar,
  } = usePagamentos(queryParams);

  const { data: medicos, isLoading: isLoadingMedicos } = useMedicos({ limit: 100 });
  const { data: hospitais, isLoading: isLoadingHospitais } = useHospitais({ limit: 100 });

  const pagamentosWithRelations: PagamentoWithRelations[] = useMemo(() => {
    return pagamentos.map((pagamento) => {
      const medico = medicos.find((m) => m.id === pagamento.medicoId);
      return {
        ...pagamento,
        medicoNome: medico?.nome,
        medicoCrm: medico?.crm,
        hospitalNome: 'Hospital Central',
        vagaData: new Date(),
      };
    });
  }, [pagamentos, medicos]);

  const totals = useMemo(() => {
    const pendente = pagamentos
      .filter((p) => p.status === 'pendente')
      .reduce((sum, p) => sum + p.valor, 0);
    const autorizado = pagamentos
      .filter((p) => p.status === 'autorizado')
      .reduce((sum, p) => sum + p.valor, 0);
    const pago = pagamentos
      .filter((p) => p.status === 'pago')
      .reduce((sum, p) => sum + p.valor, 0);
    return { pendente, autorizado, pago };
  }, [pagamentos]);

  const handleAutorizar = useCallback(async (pagamento: PagamentoWithRelations) => {
    await autorizar(pagamento.id);
  }, [autorizar]);

  const handlePagar = useCallback(async (pagamento: PagamentoWithRelations) => {
    await pagar(pagamento.id);
  }, [pagar]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleBulkAutorizar = useCallback(async () => {
    await bulkAutorizar(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, bulkAutorizar]);

  const handleBulkPagar = useCallback(async () => {
    await bulkPagar(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, bulkPagar]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading || isLoadingMedicos || isLoadingHospitais) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <DollarSignIcon />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('summary.totalPending')}</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {formatCurrency(totals.pendente)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <DollarSignIcon />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('summary.totalAuthorized')}</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {formatCurrency(totals.autorizado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DollarSignIcon />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('summary.totalPaid')}</p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(totals.pago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PagamentosFilters
        medicos={medicos}
        hospitais={hospitais}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      {pagamentos.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title={t('noPagamentos')}
          description={t('noPagamentosDescription')}
        />
      ) : (
        <PagamentosTable
          data={pagamentosWithRelations}
          sorting={sorting}
          onSort={onSort}
          pageIndex={page - 1}
          pageSize={pageSize}
          totalCount={meta.total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onAutorizar={handleAutorizar}
          onPagar={handlePagar}
        />
      )}

      <BulkActionsBar selectedCount={selectedIds.length} onClear={handleClearSelection}>
        <Button size="sm" onClick={handleBulkAutorizar}>
          <CheckIcon />
          {t('bulk.authorizeSelected')}
        </Button>
        <Button size="sm" variant="outline" onClick={handleBulkPagar}>
          <DollarSignIcon />
          {t('bulk.paySelected')}
        </Button>
      </BulkActionsBar>
    </div>
  );
}
