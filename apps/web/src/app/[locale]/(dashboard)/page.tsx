'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useVagas, useHospitais, usePagamentos } from '@/hooks';
import {
  DashboardFilters,
  DashboardFiltersValue,
  GlobalMetrics,
  HospitalCard,
} from '@/components/dashboard';
import type { QueryParams } from '@/services/types';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const [filters, setFilters] = useState<DashboardFiltersValue>({
    month: new Date(),
    hospitalIds: [],
  });

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = { limit: 1000 };
    if (filters.month) {
      const year = filters.month.getFullYear();
      const month = filters.month.getMonth() + 1;
      params.mes = month;
      params.ano = year;
    }
    if (filters.hospitalIds.length > 0) {
      params.hospitalId = filters.hospitalIds[0];
    }
    return params;
  }, [filters]);

  const { data: vagas, isLoading: isLoadingVagas } = useVagas(queryParams);
  const { data: hospitais, isLoading: isLoadingHospitais } = useHospitais({ limit: 100 });
  const { data: pagamentos, isLoading: isLoadingPagamentos } = usePagamentos(queryParams);

  const isLoading = isLoadingVagas || isLoadingHospitais || isLoadingPagamentos;

  const hospitaisWithVagas = useMemo(() => {
    return hospitais.map((hospital) => ({
      hospital,
      vagas: vagas.filter((v) => v.hospitalId === hospital.id),
    }));
  }, [hospitais, vagas]);

  const filteredHospitaisWithVagas = useMemo(() => {
    if (filters.hospitalIds.length === 0) {
      return hospitaisWithVagas.filter((h) => h.vagas.length > 0);
    }
    return hospitaisWithVagas.filter((h) => filters.hospitalIds.includes(h.hospital.id));
  }, [hospitaisWithVagas, filters.hospitalIds]);

  const handleHospitalClick = (hospitalId: string) => {
    setFilters((prev) => ({
      ...prev,
      hospitalIds: [hospitalId],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <DashboardFilters
        hospitals={hospitais}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      <GlobalMetrics
        vagas={vagas}
        pagamentos={pagamentos}
        isLoading={isLoading}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('hospitals')}</h2>
        {filteredHospitaisWithVagas.length === 0 ? (
          <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
            {t('noHospitals')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHospitaisWithVagas.map(({ hospital, vagas }) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                vagas={vagas}
                onClick={() => handleHospitalClick(hospital.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
