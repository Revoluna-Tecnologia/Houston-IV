import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpExceptionFilter } from '../http-exception.filter'
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common'

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter
  let mockResponse: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }
  let mockRequest: { url: string; method: string; ip: string; headers: Record<string, string> }
  let mockHost: ArgumentsHost

  beforeEach(() => {
    filter = new HttpExceptionFilter()
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockRequest = {
      url: '/test-path',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    }
    mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue(mockResponse),
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost
  })

  it('should handle HttpException and return correct format', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND)
    filter.catch(exception, mockHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        path: '/test-path',
      })
    )
  })

  it('should handle BadRequest exception', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST)
    filter.catch(exception, mockHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
      })
    )
  })

  it('should handle unknown exception as internal server error', () => {
    const exception = new Error('Unknown error')
    filter.catch(exception, mockHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno do servidor',
      })
    )
  })

  it('should include timestamp in response', () => {
    const exception = new HttpException('Test', HttpStatus.OK)
    filter.catch(exception, mockHost)

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    )
  })

  it('should handle null exception as internal server error', () => {
    filter.catch(null, mockHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Erro interno do servidor',
      })
    )
  })
})
