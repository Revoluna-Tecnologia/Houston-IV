import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { WhatsAppInstanceStatus } from '@prisma/client'
import { InstancesController } from '../instances.controller'
import { InstancesService } from '../instances.service'

describe('InstancesController', () => {
  let controller: InstancesController
  let service: {
    create: Mock
    findAll: Mock
    findOne: Mock
    findByGrupo: Mock
    update: Mock
    delete: Mock
    getQRCode: Mock
    getPairingCode: Mock
    getConnectionStatus: Mock
    powerOn: Mock
    powerOff: Mock
    disconnect: Mock
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin' as const,
    grupoIds: ['grupo-1'],
    permissions: [],
    iat: 0,
    exp: 0,
  }

  const mockInstance = {
    id: 'instance-1',
    grupoId: 'grupo-1',
    provider: 'zapster',
    providerInstanceId: 'provider-instance-1',
    instanceName: 'Test Instance',
    status: WhatsAppInstanceStatus.disconnected,
    phoneNumber: undefined,
    metadata: undefined,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    service = {
      create: vi.fn().mockResolvedValue(mockInstance),
      findAll: vi.fn().mockResolvedValue([mockInstance]),
      findOne: vi.fn().mockResolvedValue(mockInstance),
      findByGrupo: vi.fn().mockResolvedValue(mockInstance),
      update: vi.fn().mockResolvedValue(mockInstance),
      delete: vi.fn().mockResolvedValue(undefined),
      getQRCode: vi.fn().mockResolvedValue({ qr: 'qr-code', expiresAt: new Date() }),
      getPairingCode: vi.fn().mockResolvedValue({ code: '123456', expiresAt: new Date() }),
      getConnectionStatus: vi.fn().mockResolvedValue({
        status: WhatsAppInstanceStatus.connected,
        isConnected: true,
      }),
      powerOn: vi.fn().mockResolvedValue(undefined),
      powerOff: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
    }

    // Directly instantiate the controller with mocked dependencies
    controller = new InstancesController(service as unknown as InstancesService)
  })

  describe('create', () => {
    it('should create a new instance', async () => {
      const dto = { grupoId: 'grupo-1', name: 'New Instance' }

      const result = await controller.create(dto, mockUser)

      expect(result.id).toBe('instance-1')
      expect(service.create).toHaveBeenCalledWith(dto, mockUser)
    })
  })

  describe('findAll', () => {
    it('should return all instances', async () => {
      const result = await controller.findAll(mockUser)

      expect(result).toHaveLength(1)
      expect(service.findAll).toHaveBeenCalledWith(mockUser)
    })
  })

  describe('findOne', () => {
    it('should return an instance by id', async () => {
      const result = await controller.findOne('instance-1', mockUser)

      expect(result.id).toBe('instance-1')
      expect(service.findOne).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('findByGrupo', () => {
    it('should return instance by grupo id', async () => {
      const result = await controller.findByGrupo('grupo-1', mockUser)

      expect(result?.id).toBe('instance-1')
      expect(service.findByGrupo).toHaveBeenCalledWith('grupo-1', mockUser)
    })
  })

  describe('update', () => {
    it('should update an instance', async () => {
      const dto = { name: 'Updated Name' }

      const result = await controller.update('instance-1', dto, mockUser)

      expect(result.id).toBe('instance-1')
      expect(service.update).toHaveBeenCalledWith('instance-1', dto, mockUser)
    })
  })

  describe('delete', () => {
    it('should delete an instance', async () => {
      await controller.delete('instance-1', mockUser)

      expect(service.delete).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('getQRCode', () => {
    it('should return QR code', async () => {
      const result = await controller.getQRCode('instance-1', mockUser)

      expect(result.qr).toBe('qr-code')
      expect(service.getQRCode).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('getPairingCode', () => {
    it('should return pairing code', async () => {
      const dto = { phoneNumber: '5511999999999' }

      const result = await controller.getPairingCode('instance-1', dto, mockUser)

      expect(result.code).toBe('123456')
      expect(service.getPairingCode).toHaveBeenCalledWith('instance-1', dto, mockUser)
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', async () => {
      const result = await controller.getConnectionStatus('instance-1', mockUser)

      expect(result.isConnected).toBe(true)
      expect(service.getConnectionStatus).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('powerOn', () => {
    it('should power on instance', async () => {
      await controller.powerOn('instance-1', mockUser)

      expect(service.powerOn).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('powerOff', () => {
    it('should power off instance', async () => {
      await controller.powerOff('instance-1', mockUser)

      expect(service.powerOff).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })

  describe('disconnect', () => {
    it('should disconnect instance', async () => {
      await controller.disconnect('instance-1', mockUser)

      expect(service.disconnect).toHaveBeenCalledWith('instance-1', mockUser)
    })
  })
})
