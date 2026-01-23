'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { candidaturasService, type Candidatura, type PaginationMeta, type QueryParams, type CreateCandidaturaDto } from '../services';

interface UseCandidaturasReturn {
  data: Candidatura[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateCandidaturaDto) => Promise<Candidatura>;
  remove: (id: string) => Promise<void>;
  aprovar: (id: string) => Promise<Candidatura>;
  rejeitar: (id: string) => Promise<Candidatura>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useCandidaturas(query?: QueryParams): UseCandidaturasReturn {
  const [data, setData] = useState<Candidatura[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await candidaturasService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch candidaturas'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateCandidaturaDto): Promise<Candidatura> => {
    const candidatura = await candidaturasService.create(createData);
    await refetch();
    return candidatura;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await candidaturasService.delete(id);
    await refetch();
  }, [refetch]);

  const aprovar = useCallback(async (id: string): Promise<Candidatura> => {
    const candidatura = await candidaturasService.aprovar(id);
    await refetch();
    return candidatura;
  }, [refetch]);

  const rejeitar = useCallback(async (id: string): Promise<Candidatura> => {
    const candidatura = await candidaturasService.rejeitar(id);
    await refetch();
    return candidatura;
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, create, remove, aprovar, rejeitar };
}
