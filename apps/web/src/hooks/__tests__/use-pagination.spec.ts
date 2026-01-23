import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../use-pagination';

describe('usePagination', () => {
  describe('initialization', () => {
    it('initializes with page 1 by default', () => {
      const { result } = renderHook(() => usePagination());
      expect(result.current.currentPage).toBe(1);
      expect(result.current.page).toBe(1);
    });

    it('initializes with custom initial page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }));
      expect(result.current.page).toBe(5);
    });

    it('initializes with default pageSize of 10', () => {
      const { result } = renderHook(() => usePagination());
      expect(result.current.pageSize).toBe(10);
    });

    it('initializes with custom pageSize', () => {
      const { result } = renderHook(() => usePagination({ initialPageSize: 25 }));
      expect(result.current.pageSize).toBe(25);
    });

    it('calculates total pages correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));
      expect(result.current.totalPages).toBe(10);
    });

    it('calculates total pages with remainder', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 95, initialPageSize: 10 }));
      expect(result.current.totalPages).toBe(10);
    });

    it('returns minimum 1 page for empty data', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0, initialPageSize: 10 }));
      expect(result.current.totalPages).toBe(1);
    });
  });

  describe('navigation flags', () => {
    it('hasNextPage is true when not on last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));
      expect(result.current.hasNextPage).toBe(true);
    });

    it('hasNextPage is false when on last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 10, initialPageSize: 10 }));
      expect(result.current.hasNextPage).toBe(false);
    });

    it('hasPrevPage is false on first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('hasPrevPage is true when not on first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe('setPage', () => {
    it('sets page to valid value', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.currentPage).toBe(5);
      expect(result.current.page).toBe(5);
    });

    it('clamps page to minimum 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(-1);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('clamps page to maximum totalPages', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(20);
      });

      expect(result.current.currentPage).toBe(10);
    });

    it('sets page to 0 as 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(0);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('setPageSize', () => {
    it('changes page size', () => {
      const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
    });

    it('resets to page 1 when changing page size', () => {
      const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('nextPage', () => {
    it('increments page when not on last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('does not increment when on last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 10, initialPageSize: 10 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('increments multiple times correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.nextPage();
        result.current.nextPage();
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(4);
    });
  });

  describe('prevPage', () => {
    it('decrements page when not on first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(4);
    });

    it('does not decrement when on first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('decrements multiple times correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPageSize: 10 }));

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.prevPage();
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(3);
    });
  });

  describe('dynamic updates', () => {
    it('updates totalPages when totalItems changes', () => {
      const { result, rerender } = renderHook(
        ({ totalItems, pageSize }) => usePagination({ totalItems, initialPageSize: pageSize }),
        { initialProps: { totalItems: 100, pageSize: 10 } }
      );

      expect(result.current.totalPages).toBe(10);

      rerender({ totalItems: 50, pageSize: 10 });

      expect(result.current.totalPages).toBe(5);
    });
  });

  describe('page alias', () => {
    it('page and currentPage are always in sync', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.page).toBe(result.current.currentPage);

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(result.current.currentPage);
    });
  });
});
