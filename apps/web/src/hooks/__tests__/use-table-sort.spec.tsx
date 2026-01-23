import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableSort } from '../use-table-sort'

describe('useTableSort', () => {
  describe('initial state', () => {
    it('should have null sorting when no default provided', () => {
      const { result } = renderHook(() => useTableSort())

      expect(result.current.sorting).toBeNull()
      expect(result.current.sortBy).toBeNull()
      expect(result.current.sortOrder).toBeNull()
    })

    it('should use default sort when provided', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'name', direction: 'asc' })
      )

      expect(result.current.sorting).toEqual({ id: 'name', direction: 'asc' })
      expect(result.current.sortBy).toBe('name')
      expect(result.current.sortOrder).toBe('asc')
    })
  })

  describe('onSort', () => {
    it('should update sorting state', () => {
      const { result } = renderHook(() => useTableSort())

      act(() => {
        result.current.onSort({ id: 'date', direction: 'desc' })
      })

      expect(result.current.sorting).toEqual({ id: 'date', direction: 'desc' })
      expect(result.current.sortBy).toBe('date')
      expect(result.current.sortOrder).toBe('desc')
    })

    it('should clear sorting when null is passed', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'name', direction: 'asc' })
      )

      expect(result.current.sorting).not.toBeNull()

      act(() => {
        result.current.onSort(null)
      })

      expect(result.current.sorting).toBeNull()
      expect(result.current.sortBy).toBeNull()
      expect(result.current.sortOrder).toBeNull()
    })

    it('should update sort direction', () => {
      const { result } = renderHook(() => useTableSort())

      act(() => {
        result.current.onSort({ id: 'name', direction: 'asc' })
      })

      expect(result.current.sortOrder).toBe('asc')

      act(() => {
        result.current.onSort({ id: 'name', direction: 'desc' })
      })

      expect(result.current.sortOrder).toBe('desc')
    })
  })

  describe('resetSort', () => {
    it('should reset to default sort when default was provided', () => {
      const { result } = renderHook(() =>
        useTableSort({ id: 'name', direction: 'asc' })
      )

      act(() => {
        result.current.onSort({ id: 'date', direction: 'desc' })
      })

      expect(result.current.sortBy).toBe('date')

      act(() => {
        result.current.resetSort()
      })

      expect(result.current.sortBy).toBe('name')
      expect(result.current.sortOrder).toBe('asc')
    })

    it('should reset to null when no default was provided', () => {
      const { result } = renderHook(() => useTableSort())

      act(() => {
        result.current.onSort({ id: 'date', direction: 'desc' })
      })

      expect(result.current.sorting).not.toBeNull()

      act(() => {
        result.current.resetSort()
      })

      expect(result.current.sorting).toBeNull()
    })
  })
})
