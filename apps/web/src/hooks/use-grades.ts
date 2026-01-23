'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { gradesService, type Grade, type Vaga, type PaginationMeta, type QueryParams, type CreateGradeDto, type UpdateGradeDto, type CreateTimeSlotDto } from '../services';

interface UseGradesReturn {
  data: Grade[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateGradeDto) => Promise<Grade>;
  update: (id: string, data: UpdateGradeDto) => Promise<Grade>;
  remove: (id: string) => Promise<void>;
  publish: (id: string) => Promise<Grade>;
  addTimeSlots: (id: string, slots: CreateTimeSlotDto[]) => Promise<void>;
  generateVagas: (id: string) => Promise<Vaga[]>;
}

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export function useGrades(query?: QueryParams): UseGradesReturn {
  const [data, setData] = useState<Grade[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);
  const queryKey = JSON.stringify(query);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await gradesService.getAll(queryRef.current);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch grades'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    refetch();
  }, [queryKey, refetch]);

  const create = useCallback(async (createData: CreateGradeDto): Promise<Grade> => {
    const grade = await gradesService.create(createData);
    await refetch();
    return grade;
  }, [refetch]);

  const update = useCallback(async (id: string, updateData: UpdateGradeDto): Promise<Grade> => {
    const grade = await gradesService.update(id, updateData);
    await refetch();
    return grade;
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await gradesService.delete(id);
    await refetch();
  }, [refetch]);

  const publish = useCallback(async (id: string): Promise<Grade> => {
    const grade = await gradesService.publish(id);
    await refetch();
    return grade;
  }, [refetch]);

  const addTimeSlots = useCallback(async (id: string, slots: CreateTimeSlotDto[]): Promise<void> => {
    await gradesService.addTimeSlots(id, slots);
    await refetch();
  }, [refetch]);

  const generateVagas = useCallback(async (id: string): Promise<Vaga[]> => {
    const vagas = await gradesService.generateVagas(id);
    await refetch();
    return vagas;
  }, [refetch]);

  return { data, meta, isLoading, error, refetch, create, update, remove, publish, addTimeSlots, generateVagas };
}
