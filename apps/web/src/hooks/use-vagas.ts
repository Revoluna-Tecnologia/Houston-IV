'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { vagasService, type Vaga, type PaginationMeta, type QueryParams, type CreateVagaDto, type UpdateVagaDto } from '../services';

interface UseVagasReturn {
  data: Vaga[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateVagaDto) => Promise<Vaga>;
  update: (id: string, data: UpdateVagaDto) => Promise<Vaga>;
  remove: (id: string) => Promise<void>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useVagas(query?: QueryParams): UseVagasReturn {
  const [data, setData] = useState<Vaga[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vagasService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vagas'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateVagaDto): Promise<Vaga> => {
    const vaga = await vagasService.create(createData);
    await refetch();
    return vaga;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateVagaDto): Promise<Vaga> => {
    const vaga = await vagasService.update(id, updateData);
    await refetch();
    return vaga;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await vagasService.delete(id);
    await refetch();
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, create, update, remove };
}
