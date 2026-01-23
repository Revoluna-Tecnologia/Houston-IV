'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pagamentosService, type Pagamento, type PaginationMeta, type QueryParams, type BulkOperationResult } from '../services';

interface UsePagamentosReturn {
  data: Pagamento[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  autorizar: (id: string) => Promise<Pagamento>;
  pagar: (id: string) => Promise<Pagamento>;
  bulkAutorizar: (ids: string[]) => Promise<BulkOperationResult>;
  bulkPagar: (ids: string[]) => Promise<BulkOperationResult>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function usePagamentos(query?: QueryParams): UsePagamentosReturn {
  const [data, setData] = useState<Pagamento[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await pagamentosService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pagamentos'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await pagamentosService.delete(id);
    await refetch();
  }, [refetch]);

  const autorizar = useCallback(async (id: string): Promise<Pagamento> => {
    const pagamento = await pagamentosService.autorizar(id);
    await refetch();
    return pagamento;
  }, [refetch]);

  const pagar = useCallback(async (id: string): Promise<Pagamento> => {
    const pagamento = await pagamentosService.pagar(id);
    await refetch();
    return pagamento;
  }, [refetch]);

  const bulkAutorizar = useCallback(async (ids: string[]): Promise<BulkOperationResult> => {
    const result = await pagamentosService.bulkAutorizar(ids);
    await refetch();
    return result;
  }, [refetch]);

  const bulkPagar = useCallback(async (ids: string[]): Promise<BulkOperationResult> => {
    const result = await pagamentosService.bulkPagar(ids);
    await refetch();
    return result;
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, remove, autorizar, pagar, bulkAutorizar, bulkPagar };
}
