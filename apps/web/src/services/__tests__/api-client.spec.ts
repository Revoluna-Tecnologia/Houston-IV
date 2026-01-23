import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ApiClient, ApiError } from '../api-client'

// Mock fetch before MSW can intercept
const mockFetch = vi.fn()
const originalFetch = global.fetch

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    // Override fetch to bypass MSW
    global.fetch = mockFetch
    mockFetch.mockReset()
    client = new ApiClient('http://localhost:3001/api')
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('constructor', () => {
    it('should create instance with base URL', () => {
      expect(client).toBeInstanceOf(ApiClient)
    })
  })

  describe('GET requests', () => {
    it('should make GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
      expect(result).toEqual({ data: 'test' })
    })

    it('should include query params in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await client.get('/test', { page: 1, limit: 10, filter: 'active' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=active'),
        expect.any(Object)
      )
    })

    it('should handle array params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await client.get('/test', { ids: ['1', '2', '3'] })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('ids=1')
      expect(calledUrl).toContain('ids=2')
      expect(calledUrl).toContain('ids=3')
    })

    it('should skip null and undefined params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await client.get('/test', { valid: 'yes', invalid: null, missing: undefined })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('valid=yes')
      expect(calledUrl).not.toContain('invalid')
      expect(calledUrl).not.toContain('missing')
    })
  })

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '123', name: 'Test' }),
      })

      const result = await client.post('/items', { name: 'Test' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
          credentials: 'include',
        })
      )
      expect(result).toEqual({ id: '123', name: 'Test' })
    })

    it('should make POST request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })

      await client.post('/action')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/action',
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123', name: 'Updated' }),
      })

      const result = await client.put('/items/123', { name: 'Updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      )
      expect(result).toEqual({ id: '123', name: 'Updated' })
    })
  })

  describe('PATCH requests', () => {
    it('should make PATCH request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123', status: 'active' }),
      })

      const result = await client.patch('/items/123', { status: 'active' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' }),
        })
      )
      expect(result).toEqual({ id: '123', status: 'active' })
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await client.delete('/items/123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should throw ApiError for non-ok responses', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            message: 'Not found',
            error: 'NotFoundError',
            timestamp: '2024-01-01T00:00:00Z',
            path: '/items/999',
          }),
      }

      mockFetch.mockResolvedValue(errorResponse)

      await expect(client.get('/items/999')).rejects.toThrow(ApiError)

      mockFetch.mockResolvedValue(errorResponse)

      await expect(client.get('/items/999')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Not found',
        error: 'NotFoundError',
      })
    })

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(client.get('/error')).rejects.toThrow(ApiError)
    })
  })

  describe('Interceptors', () => {
    it('should apply request interceptors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })

      client.addRequestInterceptor((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'test-value',
        },
      }))

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
          }),
        })
      )
    })

    it('should apply response interceptors', async () => {
      const originalResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      }

      mockFetch.mockResolvedValueOnce(originalResponse)

      const responseInterceptor = vi.fn().mockReturnValue(originalResponse)
      client.addResponseInterceptor(responseInterceptor)

      await client.get('/test')

      expect(responseInterceptor).toHaveBeenCalled()
    })

    it('should apply multiple interceptors in order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const order: number[] = []

      client.addRequestInterceptor((config) => {
        order.push(1)
        return config
      })

      client.addRequestInterceptor((config) => {
        order.push(2)
        return config
      })

      await client.get('/test')

      expect(order).toEqual([1, 2])
    })
  })
})

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError(
      404,
      'Not found',
      'NotFoundError',
      '2024-01-01T00:00:00Z',
      '/items/123'
    )

    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Not found')
    expect(error.error).toBe('NotFoundError')
    expect(error.timestamp).toBe('2024-01-01T00:00:00Z')
    expect(error.path).toBe('/items/123')
    expect(error.name).toBe('ApiError')
  })

  it('should be instance of Error', () => {
    const error = new ApiError(500, 'Internal error')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
  })
})
