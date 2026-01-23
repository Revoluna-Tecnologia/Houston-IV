'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { escalistasService, type CreateEscalistaDto, type UpdateEscalistaDto } from '../services/escalistas-service';
import type { Escalista, PaginationMeta, QueryParams, BulkOperationResult } from '../services/types';

interface UseEscalistasReturn {
  data: Escalista[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateEscalistaDto) => Promise<Escalista>;
  update: (id: string, data: UpdateEscalistaDto) => Promise<Escalista>;
  remove: (id: string) => Promise<void>;
  ativar: (id: string) => Promise<Escalista>;
  inativar: (id: string) => Promise<Escalista>;
  bulkAtivar: (ids: string[]) => Promise<BulkOperationResult>;
  bulkInativar: (ids: string[]) => Promise<BulkOperationResult>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useEscalistas(query?: QueryParams): UseEscalistasReturn {
  const [data, setData] = useState<Escalista[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await escalistasService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch escalistas'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateEscalistaDto): Promise<Escalista> => {
    const escalista = await escalistasService.create(createData);
    await refetch();
    return escalista;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateEscalistaDto): Promise<Escalista> => {
    const escalista = await escalistasService.update(id, updateData);
    await refetch();
    return escalista;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await escalistasService.delete(id);
    await refetch();
  }, [refetch]);

  const ativar = useCallback(async (id: string): Promise<Escalista> => {
    const escalista = await escalistasService.ativar(id);
    await refetch();
    return escalista;
  }, [refetch]);

  const inativar = useCallback(async (id: string): Promise<Escalista> => {
    const escalista = await escalistasService.inativar(id);
    await refetch();
    return escalista;
  }, [refetch]);

  const bulkAtivar = useCallback(async (ids: string[]): Promise<BulkOperationResult> => {
    const result = await escalistasService.bulkAtivar(ids);
    await refetch();
    return result;
  }, [refetch]);

  const bulkInativar = useCallback(async (ids: string[]): Promise<BulkOperationResult> => {
    const result = await escalistasService.bulkInativar(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    data,
    meta,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
    ativar,
    inativar,
    bulkAtivar,
    bulkInativar,
  };
}
