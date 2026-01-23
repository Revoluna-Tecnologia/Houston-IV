import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaService } from '../prisma.service'

describe('PrismaService', () => {
  let service: PrismaService
  let connectMock: ReturnType<typeof vi.fn>
  let disconnectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    connectMock = vi.fn().mockResolvedValue(undefined)
    disconnectMock = vi.fn().mockResolvedValue(undefined)

    service = new PrismaService()
    // Assign mocks directly since PrismaClient is mocked
    service.$connect = connectMock
    service.$disconnect = disconnectMock
  })

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      await service.onModuleInit()

      expect(connectMock).toHaveBeenCalled()
    })

    it('should connect once', async () => {
      await service.onModuleInit()

      expect(connectMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('onModuleDestroy', () => {
    it('should call $disconnect', async () => {
      await service.onModuleDestroy()

      expect(disconnectMock).toHaveBeenCalled()
    })

    it('should disconnect once', async () => {
      await service.onModuleDestroy()

      expect(disconnectMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('lifecycle', () => {
    it('should handle full lifecycle', async () => {
      await service.onModuleInit()
      expect(connectMock).toHaveBeenCalled()

      await service.onModuleDestroy()
      expect(disconnectMock).toHaveBeenCalled()
    })
  })
})
