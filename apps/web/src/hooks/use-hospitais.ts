'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { hospitaisService, type Hospital, type PaginationMeta, type QueryParams, type CreateHospitalDto, type UpdateHospitalDto } from '../services';

interface UseHospitaisReturn {
  data: Hospital[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateHospitalDto) => Promise<Hospital>;
  update: (id: string, data: UpdateHospitalDto) => Promise<Hospital>;
  remove: (id: string) => Promise<void>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useHospitais(query?: QueryParams): UseHospitaisReturn {
  const [data, setData] = useState<Hospital[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await hospitaisService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch hospitais'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateHospitalDto): Promise<Hospital> => {
    const hospital = await hospitaisService.create(createData);
    await refetch();
    return hospital;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateHospitalDto): Promise<Hospital> => {
    const hospital = await hospitaisService.update(id, updateData);
    await refetch();
    return hospital;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await hospitaisService.delete(id);
    await refetch();
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, create, update, remove };
}
