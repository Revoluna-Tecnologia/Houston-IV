import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../use-pagination'

describe('usePagination', () => {
  describe('initial state', () => {
    it('should use default values when no options provided', () => {
      const { result } = renderHook(() => usePagination())

      expect(result.current.currentPage).toBe(1)
      expect(result.current.page).toBe(1)
      expect(result.current.pageSize).toBe(10)
      expect(result.current.totalPages).toBe(1)
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.hasPrevPage).toBe(false)
    })

    it('should use provided initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 2, initialPageSize: 20, totalItems: 100 })
      )

      expect(result.current.currentPage).toBe(2)
      expect(result.current.pageSize).toBe(20)
      expect(result.current.totalPages).toBe(5)
    })
  })

  describe('setPage', () => {
    it('should change the current page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }))

      act(() => {
        result.current.setPage(5)
      })

      expect(result.current.currentPage).toBe(5)
    })

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }))

      act(() => {
        result.current.setPage(0)
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('should not go above total pages', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 50 }))

      act(() => {
        result.current.setPage(100)
      })

      expect(result.current.currentPage).toBe(5)
    })
  })

  describe('setPageSize', () => {
    it('should change the page size', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }))

      act(() => {
        result.current.setPageSize(25)
      })

      expect(result.current.pageSize).toBe(25)
      expect(result.current.totalPages).toBe(4)
    })

    it('should reset to page 1 when page size changes', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, totalItems: 100 })
      )

      expect(result.current.currentPage).toBe(3)

      act(() => {
        result.current.setPageSize(25)
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('nextPage', () => {
    it('should go to next page when available', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }))

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('should not go past last page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 10, totalItems: 100 })
      )

      expect(result.current.currentPage).toBe(10)

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(10)
    })
  })

  describe('prevPage', () => {
    it('should go to previous page when available', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, totalItems: 100 })
      )

      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(4)
    })

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }))

      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('hasNextPage/hasPrevPage', () => {
    it('should correctly indicate navigation availability', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, totalItems: 100 })
      )

      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.hasPrevPage).toBe(true)

      act(() => {
        result.current.setPage(1)
      })

      expect(result.current.hasPrevPage).toBe(false)
      expect(result.current.hasNextPage).toBe(true)

      act(() => {
        result.current.setPage(10)
      })

      expect(result.current.hasPrevPage).toBe(true)
      expect(result.current.hasNextPage).toBe(false)
    })
  })

  describe('totalPages calculation', () => {
    it('should calculate total pages correctly', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 95, initialPageSize: 10 })
      )

      expect(result.current.totalPages).toBe(10)
    })

    it('should have minimum of 1 page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }))

      expect(result.current.totalPages).toBe(1)
    })
  })
})
