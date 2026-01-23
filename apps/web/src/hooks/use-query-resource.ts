'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationMeta, QueryParams } from '../services';

interface ResourceService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  getAll: (params?: QueryParams) => Promise<{ data: T[]; meta: PaginationMeta }>;
  getById?: (id: string) => Promise<T>;
  create?: (data: CreateDto) => Promise<T>;
  update?: (id: string, data: UpdateDto) => Promise<T>;
  delete?: (id: string) => Promise<void>;
}

interface UseQueryResourceReturn<T, CreateDto, UpdateDto> {
  data: T[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create?: (data: CreateDto) => Promise<T>;
  update?: (id: string, data: UpdateDto) => Promise<T>;
  remove?: (id: string) => Promise<void>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useQueryResource<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>(
  resourceName: string,
  service: ResourceService<T, CreateDto, UpdateDto>,
  query?: QueryParams
): UseQueryResourceReturn<T, CreateDto, UpdateDto> {
  const queryClient = useQueryClient();
  const queryKey = [resourceName, query];

  const { data: response, isLoading, error, refetch: refetchQuery } = useQuery({
    queryKey,
    queryFn: () => service.getAll(query),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const createMutation = service.create ? useMutation({
    mutationFn: (data: CreateDto) => service.create!(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
    },
  }) : undefined;

  const updateMutation = service.update ? useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDto }) => service.update!(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
    },
  }) : undefined;

  const removeMutation = service.delete ? useMutation({
    mutationFn: (id: string) => service.delete!(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceName] });
    },
  }) : undefined;

  return {
    data: response?.data ?? [],
    meta: response?.meta ?? defaultMeta,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetchQuery();
    },
    create: createMutation ? async (data: CreateDto) => createMutation.mutateAsync(data) : undefined,
    update: updateMutation ? async (id: string, data: UpdateDto) => updateMutation.mutateAsync({ id, data }) : undefined,
    remove: removeMutation ? async (id: string) => removeMutation.mutateAsync(id) : undefined,
  };
}
