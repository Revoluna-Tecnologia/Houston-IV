'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortingState } from '@/components/houston';

interface UseTableSortReturn {
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
  resetSort: () => void;
}

interface DefaultSort {
  id: string;
  direction: 'asc' | 'desc';
}

export function useTableSort(defaultSort?: DefaultSort): UseTableSortReturn {
  const [sorting, setSorting] = useState<SortingState | null>(
    defaultSort ? { id: defaultSort.id, direction: defaultSort.direction } : null
  );

  const onSort = useCallback((newSorting: SortingState | null) => {
    setSorting(newSorting);
  }, []);

  const resetSort = useCallback(() => {
    setSorting(defaultSort ? { id: defaultSort.id, direction: defaultSort.direction } : null);
  }, [defaultSort]);

  const sortBy = useMemo(() => sorting?.id ?? null, [sorting]);
  const sortOrder = useMemo(() => sorting?.direction ?? null, [sorting]);

  return { sorting, onSort, sortBy, sortOrder, resetSort };
}
