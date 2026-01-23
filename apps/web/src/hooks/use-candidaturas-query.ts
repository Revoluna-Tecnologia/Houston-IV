'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidaturasService, type Candidatura, type QueryParams, type CreateCandidaturaDto } from '../services';
import { useQueryResource } from './use-query-resource';

interface UseCandidaturasReturn {
  data: Candidatura[];
  meta: ReturnType<typeof useQueryResource>['meta'];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateCandidaturaDto) => Promise<Candidatura>;
  remove: (id: string) => Promise<void>;
  aprovar: (id: string) => Promise<Candidatura>;
  rejeitar: (id: string) => Promise<Candidatura>;
}

export function useCandidaturasQuery(query?: QueryParams): UseCandidaturasReturn {
  const queryClient = useQueryClient();
  const baseQuery = useQueryResource('candidaturas', candidaturasService, query);

  const aprovarMutation = useMutation({
    mutationFn: (id: string) => candidaturasService.aprovar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidaturas'] });
    },
  });

  const rejeitarMutation = useMutation({
    mutationFn: (id: string) => candidaturasService.rejeitar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidaturas'] });
    },
  });

  return {
    ...baseQuery,
    create: baseQuery.create!,
    remove: baseQuery.remove!,
    aprovar: async (id: string) => aprovarMutation.mutateAsync(id),
    rejeitar: async (id: string) => rejeitarMutation.mutateAsync(id),
  };
}
