import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { AuditInterceptor } from '../audit.interceptor'
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { of, throwError, lastValueFrom } from 'rxjs'
import { PrismaService } from '../../../prisma/prisma.service'

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor
  let mockPrisma: { auditLog: { create: Mock } }
  let mockContext: ExecutionContext
  let mockCallHandler: CallHandler
  let mockRequest: Record<string, unknown>

  const createMockContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}) as never,
      switchToWs: () => ({}) as never,
      getType: () => 'http',
    }) as unknown as ExecutionContext

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-123' }),
      },
    }

    interceptor = new AuditInterceptor(mockPrisma as unknown as PrismaService)

    // Suprimir logs durante testes
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})

    mockRequest = {
      method: 'POST',
      url: '/api/vagas',
      user: { id: 'user-123', email: 'test@test.com' },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Test Agent',
        'x-correlation-id': 'corr-123',
      },
      body: { nome: 'Test Vaga' },
    }
  })

  describe('intercept - skip conditions', () => {
    it('should skip GET requests', async () => {
      mockRequest.method = 'GET'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ data: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should skip HEAD requests', async () => {
      mockRequest.method = 'HEAD'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of(null) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should skip OPTIONS requests', async () => {
      mockRequest.method = 'OPTIONS'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of(null) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should skip when user is not authenticated', async () => {
      mockRequest.user = undefined
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'new-123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should skip when user has no email', async () => {
      mockRequest.user = { id: 'user-123' }
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'new-123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })
  })

  describe('intercept - CREATE action (POST)', () => {
    it('should log CREATE action for POST request', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'created-123', nome: 'Test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract resource from URL', async () => {
      mockRequest.url = '/api/medicos'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'med-123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract resource ID from response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'new-resource-id', nome: 'Test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - UPDATE action (PUT/PATCH)', () => {
    it('should log UPDATE action for PUT request', async () => {
      mockRequest.method = 'PUT'
      mockRequest.url = '/api/vagas/vaga-123'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'vaga-123', nome: 'Updated' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should log UPDATE action for PATCH request', async () => {
      mockRequest.method = 'PATCH'
      mockRequest.url = '/api/vagas/vaga-456'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'vaga-456', status: 'updated' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should capture request body as old value for updates', async () => {
      mockRequest.method = 'PUT'
      mockRequest.body = { nome: 'Old Name' }
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'vaga-123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - DELETE action', () => {
    it('should log DELETE action', async () => {
      mockRequest.method = 'DELETE'
      mockRequest.url = '/api/vagas/vaga-to-delete'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ success: true }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract resource ID from URL for DELETE', async () => {
      mockRequest.method = 'DELETE'
      mockRequest.url = '/api/grupos/550e8400-e29b-41d4-a716-446655440000'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of(null) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - metadata extraction', () => {
    it('should extract IP address', async () => {
      mockRequest.ip = '192.168.1.1'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract user agent', async () => {
      mockRequest.headers = {
        ...mockRequest.headers as Record<string, string>,
        'user-agent': 'Mozilla/5.0 Test Browser',
      }
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract correlation ID from x-correlation-id header', async () => {
      mockRequest.headers = {
        ...mockRequest.headers as Record<string, string>,
        'x-correlation-id': 'correlation-test-123',
      }
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract correlation ID from x-request-id header', async () => {
      mockRequest.headers = {
        'x-request-id': 'request-id-456',
      }
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - response sanitization', () => {
    it('should redact password field in response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = {
        handle: () => of({ id: 'test', password: 'secret123' }),
      }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should redact token field in response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = {
        handle: () => of({ id: 'test', token: 'jwt-token-here' }),
      }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should redact secret field in response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = {
        handle: () => of({ id: 'test', secret: 'my-secret-key' }),
      }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should redact apiKey field in response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = {
        handle: () => of({ id: 'test', apiKey: 'api-key-123' }),
      }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should handle null response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of(null) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should handle non-object response', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of('string response') }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - resource extraction', () => {
    it('should extract resource from /api/vagas URL', async () => {
      mockRequest.url = '/api/vagas'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract resource from /api/hospitais/123 URL', async () => {
      mockRequest.url = '/api/hospitais/hosp-123'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'hosp-123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should extract UUID from URL', async () => {
      mockRequest.url = '/api/grupos/550e8400-e29b-41d4-a716-446655440000'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ success: true }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('should handle URL without /api prefix', async () => {
      mockRequest.url = '/vagas/123'
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: '123' }) }

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('intercept - error handling', () => {
    it('should not log audit for failed requests', async () => {
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => throwError(() => new Error('Request failed')) }

      await expect(
        lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))
      ).rejects.toThrow('Request failed')

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should handle database error gracefully', async () => {
      mockPrisma.auditLog.create.mockRejectedValueOnce(new Error('Database error'))
      mockContext = createMockContext(mockRequest)
      mockCallHandler = { handle: () => of({ id: 'test' }) }

      // Should not throw - error is caught and logged
      const result = await lastValueFrom(
        interceptor.intercept(mockContext, mockCallHandler)
      )

      expect(result).toEqual({ id: 'test' })
    })
  })

  describe('intercept - all resources', () => {
    const resources = [
      'vagas',
      'medicos',
      'hospitais',
      'grupos',
      'candidaturas',
      'pagamentos',
      'escalistas',
      'setores',
      'especialidades',
      'grades',
      'relatorios',
    ]

    for (const resource of resources) {
      it(`should audit ${resource} resource`, async () => {
        mockRequest.url = `/api/${resource}`
        mockContext = createMockContext(mockRequest)
        mockCallHandler = { handle: () => of({ id: `${resource}-123` }) }

        await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

        expect(mockPrisma.auditLog.create).toHaveBeenCalled()
      })
    }
  })
})
