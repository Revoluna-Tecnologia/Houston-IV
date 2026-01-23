'use client';

import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationReturn {
  page: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

export function usePagination(options?: UsePaginationOptions): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 10, totalItems = 0 } = options ?? {};

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);

  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 999));
    setCurrentPage(validPage);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  return {
    page: currentPage,
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  };
}
