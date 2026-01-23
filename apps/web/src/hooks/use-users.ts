'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usersService, type CreateUserDto, type UpdateUserDto } from '../services/users-service';
import type { User, PaginationMeta, QueryParams } from '../services/types';

interface UseUsersReturn {
  data: User[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateUserDto) => Promise<User>;
  update: (id: string, data: UpdateUserDto) => Promise<User>;
  remove: (id: string) => Promise<void>;
  activate: (id: string) => Promise<User>;
  deactivate: (id: string) => Promise<User>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useUsers(query?: QueryParams): UseUsersReturn {
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateUserDto): Promise<User> => {
    const user = await usersService.create(createData);
    await refetch();
    return user;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateUserDto): Promise<User> => {
    const user = await usersService.update(id, updateData);
    await refetch();
    return user;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await usersService.delete(id);
    await refetch();
  }, [refetch]);

  const activate = useCallback(async (id: string): Promise<User> => {
    const user = await usersService.activate(id);
    await refetch();
    return user;
  }, [refetch]);

  const deactivate = useCallback(async (id: string): Promise<User> => {
    const user = await usersService.deactivate(id);
    await refetch();
    return user;
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
    activate,
    deactivate,
  };
}
