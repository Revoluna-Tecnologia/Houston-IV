import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableSort } from '../use-table-sort';

describe('useTableSort', () => {
  describe('initialization', () => {
    it('initializes with null sorting when no default', () => {
      const { result } = renderHook(() => useTableSort());
      expect(result.current.sorting).toBeNull();
    });

    it('initializes with null sortBy when no default', () => {
      const { result } = renderHook(() => useTableSort());
      expect(result.current.sortBy).toBeNull();
    });

    it('initializes with null sortOrder when no default', () => {
      const { result } = renderHook(() => useTableSort());
      expect(result.current.sortOrder).toBeNull();
    });

    it('initializes with default sorting', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'nome', direction: 'asc' })
      );
      expect(result.current.sorting).toEqual({ id: 'nome', direction: 'asc' });
    });

    it('initializes with default sortBy', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'nome', direction: 'asc' })
      );
      expect(result.current.sortBy).toBe('nome');
    });

    it('initializes with default sortOrder', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'nome', direction: 'desc' })
      );
      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('onSort', () => {
    it('sets sorting when called with new sorting state', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
      });

      expect(result.current.sorting).toEqual({ id: 'nome', direction: 'asc' });
    });

    it('updates sortBy derived value', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'valor', direction: 'asc' });
      });

      expect(result.current.sortBy).toBe('valor');
    });

    it('updates sortOrder derived value', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'desc' });
      });

      expect(result.current.sortOrder).toBe('desc');
    });

    it('can set sorting to null', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
      });

      act(() => {
        result.current.onSort(null);
      });

      expect(result.current.sorting).toBeNull();
      expect(result.current.sortBy).toBeNull();
      expect(result.current.sortOrder).toBeNull();
    });

    it('can change columns', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
      });

      expect(result.current.sortBy).toBe('nome');

      act(() => {
        result.current.onSort({ id: 'valor', direction: 'desc' });
      });

      expect(result.current.sortBy).toBe('valor');
      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('resetSort', () => {
    it('resets to null when no default', () => {
      const { result } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'desc' });
      });

      act(() => {
        result.current.resetSort();
      });

      expect(result.current.sorting).toBeNull();
      expect(result.current.sortBy).toBeNull();
      expect(result.current.sortOrder).toBeNull();
    });

    it('resets to default values when provided', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'valor', direction: 'desc' })
      );

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
      });

      act(() => {
        result.current.resetSort();
      });

      expect(result.current.sorting).toEqual({ id: 'valor', direction: 'desc' });
      expect(result.current.sortBy).toBe('valor');
      expect(result.current.sortOrder).toBe('desc');
    });

    it('resets after multiple operations', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'id', direction: 'asc' })
      );

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
        result.current.onSort({ id: 'valor', direction: 'desc' });
        result.current.onSort({ id: 'data', direction: 'asc' });
      });

      act(() => {
        result.current.resetSort();
      });

      expect(result.current.sortBy).toBe('id');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('state consistency', () => {
    it('maintains state across renders', () => {
      const { result, rerender } = renderHook(() => useTableSort());

      act(() => {
        result.current.onSort({ id: 'nome', direction: 'asc' });
      });

      rerender();

      expect(result.current.sortBy).toBe('nome');
    });

    it('returns consistent functions', () => {
      const { result, rerender } = renderHook(() => useTableSort());

      const { onSort: onSort1, resetSort: reset1 } = result.current;

      rerender();

      expect(result.current.onSort).toBe(onSort1);
      expect(result.current.resetSort).toBe(reset1);
    });
  });
});
