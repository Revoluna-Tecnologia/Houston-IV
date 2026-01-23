import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from '../health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  describe('check', () => {
    it('should return health status', () => {
      const result = controller.check()

      expect(result.status).toBe('ok')
      expect(result.timestamp).toBeDefined()
    })

    it('should return valid ISO timestamp', () => {
      const result = controller.check()

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should return current time', () => {
      const before = new Date().getTime()
      const result = controller.check()
      const after = new Date().getTime()

      const resultTime = new Date(result.timestamp).getTime()
      expect(resultTime).toBeGreaterThanOrEqual(before)
      expect(resultTime).toBeLessThanOrEqual(after)
    })

    it('should always return status ok', () => {
      // Call multiple times to ensure consistency
      for (let i = 0; i < 5; i++) {
        const result = controller.check()
        expect(result.status).toBe('ok')
      }
    })
  })
})
