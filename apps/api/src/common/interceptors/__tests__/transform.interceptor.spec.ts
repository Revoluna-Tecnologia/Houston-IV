import { describe, it, expect, beforeEach } from 'vitest'
import { TransformInterceptor } from '../transform.interceptor'
import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of, lastValueFrom } from 'rxjs'

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>
  let mockContext: ExecutionContext
  let mockCallHandler: CallHandler

  beforeEach(() => {
    interceptor = new TransformInterceptor()
    mockContext = {} as ExecutionContext
  })

  it('should wrap response data in standard format', async () => {
    const testData = { id: 1, name: 'Test' }
    mockCallHandler = { handle: () => of(testData) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('timestamp')
    expect(result.data).toEqual(testData)
  })

  it('should include valid ISO timestamp', async () => {
    const testData = { message: 'hello' }
    mockCallHandler = { handle: () => of(testData) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
  })

  it('should handle null data', async () => {
    mockCallHandler = { handle: () => of(null) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toBeNull()
    expect(result.timestamp).toBeDefined()
  })

  it('should handle array data', async () => {
    const testData = [{ id: 1 }, { id: 2 }]
    mockCallHandler = { handle: () => of(testData) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toEqual(testData)
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should handle empty object', async () => {
    mockCallHandler = { handle: () => of({}) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toEqual({})
  })

  it('should handle string data', async () => {
    mockCallHandler = { handle: () => of('test string') }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toBe('test string')
  })

  it('should handle number data', async () => {
    mockCallHandler = { handle: () => of(42) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toBe(42)
  })

  it('should handle boolean data', async () => {
    mockCallHandler = { handle: () => of(true) }

    const result = await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

    expect(result.data).toBe(true)
  })
})
