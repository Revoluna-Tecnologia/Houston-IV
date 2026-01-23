'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { medicosService, type Medico, type PaginationMeta, type QueryParams, type CreateMedicoDto, type UpdateMedicoDto } from '../services';

interface UseMedicosReturn {
  data: Medico[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateMedicoDto) => Promise<Medico>;
  update: (id: string, data: UpdateMedicoDto) => Promise<Medico>;
  remove: (id: string) => Promise<void>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useMedicos(query?: QueryParams): UseMedicosReturn {
  const [data, setData] = useState<Medico[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicosService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch medicos'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateMedicoDto): Promise<Medico> => {
    const medico = await medicosService.create(createData);
    await refetch();
    return medico;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateMedicoDto): Promise<Medico> => {
    const medico = await medicosService.update(id, updateData);
    await refetch();
    return medico;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await medicosService.delete(id);
    await refetch();
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, create, update, remove };
}
