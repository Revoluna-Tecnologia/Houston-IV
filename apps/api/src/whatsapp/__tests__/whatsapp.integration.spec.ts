import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common'
import { WhatsAppInstanceStatus } from '@prisma/client'
import { InstancesService } from '../instances/instances.service'
import { InstancesRepository } from '../instances/instances.repository'
import { WhatsAppService } from '../whatsapp.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthenticatedUser } from '../../auth/types/auth.types'
import { ConnectionStatus } from '../types'

// Mock WhatsAppService
const mockWhatsAppService = {
  createInstance: vi.fn(),
  deleteInstance: vi.fn(),
  getActiveProvider: vi.fn().mockReturnValue('zapster'),
  getQRCode: vi.fn(),
  getPairingCode: vi.fn(),
  getConnectionStatus: vi.fn(),
  getInstance: vi.fn(),
  powerOn: vi.fn(),
  powerOff: vi.fn(),
  disconnect: vi.fn(),
}

describe('WhatsAppModule (Integration)', () => {
  let module: TestingModule
  let instancesService: InstancesService
  let prisma: PrismaService
  let testGrupoId: string
  let testUserId: string

  const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: testUserId,
    email: 'test@example.com',
    role: 'administrador',
    grupoIds: [testGrupoId],
    permissions: [],
    ...overrides,
  })

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [
        InstancesService,
        InstancesRepository,
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    }).compile()

    instancesService = module.get<InstancesService>(InstancesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clean up in correct order (respecting foreign keys)
    await prisma.whatsAppInstance.deleteMany()
    await prisma.escalista.deleteMany()
    await prisma.grupo.deleteMany()

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo Teste WhatsApp' },
    })
    testGrupoId = grupo.id

    // Create test user (escalista)
    const escalista = await prisma.escalista.create({
      data: {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'hashed_password',
        role: 'administrador',
      },
    })
    testUserId = escalista.id
  })

  describe('InstancesService', () => {
    describe('create', () => {
      it('should create a new WhatsApp instance', async () => {
        const user = createMockUser()
        const dto = {
          grupoId: testGrupoId,
          name: 'Instância Teste',
        }

        mockWhatsAppService.createInstance.mockResolvedValue({
          id: 'provider-instance-123',
          status: ConnectionStatus.OFFLINE,
          phoneNumber: null,
          metadata: {},
        })

        const result = await instancesService.create(dto, user)

        expect(result).toBeDefined()
        expect(result.id).toBeDefined()
        expect(result.grupoId).toBe(testGrupoId)
        expect(result.instanceName).toBe(dto.name)
        expect(result.provider).toBe('zapster')
        expect(result.status).toBe(WhatsAppInstanceStatus.offline)
        expect(mockWhatsAppService.createInstance).toHaveBeenCalledWith(dto.name)
      })

      it('should throw ForbiddenException when user has no access to grupo', async () => {
        const user = createMockUser({ grupoIds: ['other-grupo-id'] })
        const dto = {
          grupoId: testGrupoId,
          name: 'Instância Teste',
        }

        await expect(instancesService.create(dto, user)).rejects.toThrow(ForbiddenException)
        await expect(instancesService.create(dto, user)).rejects.toThrow('Sem acesso ao grupo')
      })

      it('should throw ConflictException when grupo already has an instance', async () => {
        const user = createMockUser()

        // Create first instance
        await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'existing-instance',
            instanceName: 'Existing Instance',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const dto = {
          grupoId: testGrupoId,
          name: 'Nova Instância',
        }

        await expect(instancesService.create(dto, user)).rejects.toThrow(ConflictException)
        await expect(instancesService.create(dto, user)).rejects.toThrow(
          'Grupo já possui uma instância WhatsApp'
        )
      })
    })

    describe('findAll', () => {
      it('should return empty array when no instances exist', async () => {
        const user = createMockUser()

        const result = await instancesService.findAll(user)

        expect(result).toEqual([])
      })

      it('should return instances for user grupos', async () => {
        const user = createMockUser()

        await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance 1',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const result = await instancesService.findAll(user)

        expect(result).toHaveLength(1)
        expect(result[0].instanceName).toBe('Instance 1')
      })

      it('should only return instances from user grupos', async () => {
        const user = createMockUser()

        // Create instance for user's grupo
        await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance 1',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        // Create another grupo and instance
        const otherGrupo = await prisma.grupo.create({
          data: { nome: 'Outro Grupo' },
        })

        await prisma.whatsAppInstance.create({
          data: {
            grupoId: otherGrupo.id,
            provider: 'zapster',
            providerInstanceId: 'instance-2',
            instanceName: 'Instance 2',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const result = await instancesService.findAll(user)

        expect(result).toHaveLength(1)
        expect(result[0].instanceName).toBe('Instance 1')
      })
    })

    describe('findOne', () => {
      it('should return an instance by id', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const result = await instancesService.findOne(instance.id, user)

        expect(result.id).toBe(instance.id)
        expect(result.instanceName).toBe('Instance Test')
      })

      it('should throw NotFoundException when instance does not exist', async () => {
        const user = createMockUser()
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(instancesService.findOne(nonExistentId, user)).rejects.toThrow(NotFoundException)
        await expect(instancesService.findOne(nonExistentId, user)).rejects.toThrow(
          'Instância não encontrada'
        )
      })

      it('should throw ForbiddenException when user has no access', async () => {
        const user = createMockUser({ grupoIds: ['other-grupo-id'] })

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        await expect(instancesService.findOne(instance.id, user)).rejects.toThrow(ForbiddenException)
        await expect(instancesService.findOne(instance.id, user)).rejects.toThrow(
          'Sem acesso à instância'
        )
      })
    })

    describe('findByGrupo', () => {
      it('should return instance for grupo', async () => {
        const user = createMockUser()

        await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const result = await instancesService.findByGrupo(testGrupoId, user)

        expect(result).toBeDefined()
        expect(result!.grupoId).toBe(testGrupoId)
      })

      it('should return null when no instance exists for grupo', async () => {
        const user = createMockUser()

        const result = await instancesService.findByGrupo(testGrupoId, user)

        expect(result).toBeNull()
      })

      it('should throw ForbiddenException when user has no access to grupo', async () => {
        const user = createMockUser({ grupoIds: ['other-grupo-id'] })

        await expect(instancesService.findByGrupo(testGrupoId, user)).rejects.toThrow(
          ForbiddenException
        )
      })
    })

    describe('update', () => {
      it('should update instance name', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Nome Original',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        const result = await instancesService.update(
          instance.id,
          { name: 'Nome Atualizado' },
          user
        )

        expect(result.instanceName).toBe('Nome Atualizado')
      })

      it('should throw NotFoundException when updating non-existent instance', async () => {
        const user = createMockUser()
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(
          instancesService.update(nonExistentId, { name: 'Novo Nome' }, user)
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('delete', () => {
      it('should delete an instance', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-to-delete',
            instanceName: 'Instance to Delete',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        mockWhatsAppService.disconnect.mockResolvedValue(undefined)
        mockWhatsAppService.deleteInstance.mockResolvedValue(undefined)

        await instancesService.delete(instance.id, user)

        expect(mockWhatsAppService.disconnect).toHaveBeenCalledWith('instance-to-delete')
        expect(mockWhatsAppService.deleteInstance).toHaveBeenCalledWith('instance-to-delete')

        await expect(instancesService.findOne(instance.id, user)).rejects.toThrow(NotFoundException)
      })

      it('should throw NotFoundException when deleting non-existent instance', async () => {
        const user = createMockUser()
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(instancesService.delete(nonExistentId, user)).rejects.toThrow(NotFoundException)
      })

      it('should throw ForbiddenException when user has no access', async () => {
        const user = createMockUser({ grupoIds: ['other-grupo-id'] })

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        await expect(instancesService.delete(instance.id, user)).rejects.toThrow(ForbiddenException)
      })
    })

    describe('getQRCode', () => {
      it('should return QR code for instance', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.offline,
            createdById: testUserId,
          },
        })

        const expiresAt = new Date(Date.now() + 60000)
        mockWhatsAppService.powerOn.mockResolvedValue(undefined)
        mockWhatsAppService.getQRCode.mockResolvedValue({
          qr: 'base64-qr-code-data',
          expiresAt,
        })

        const result = await instancesService.getQRCode(instance.id, user)

        expect(result.qr).toBe('base64-qr-code-data')
        expect(result.expiresAt).toEqual(expiresAt)
        expect(mockWhatsAppService.powerOn).toHaveBeenCalledWith('instance-1')
        expect(mockWhatsAppService.getQRCode).toHaveBeenCalledWith('instance-1')
      })
    })

    describe('getConnectionStatus', () => {
      it('should return connection status', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connecting,
            phoneNumber: '5511999998888',
            createdById: testUserId,
          },
        })

        mockWhatsAppService.getConnectionStatus.mockResolvedValue(ConnectionStatus.CONNECTED)

        const result = await instancesService.getConnectionStatus(instance.id, user)

        expect(result.status).toBe(WhatsAppInstanceStatus.connected)
        expect(result.isConnected).toBe(true)
        expect(result.phoneNumber).toBe('5511999998888')
      })

      it('should update status in database when different', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connecting,
            createdById: testUserId,
          },
        })

        mockWhatsAppService.getConnectionStatus.mockResolvedValue(ConnectionStatus.CONNECTED)

        await instancesService.getConnectionStatus(instance.id, user)

        // Check database was updated
        const updated = await prisma.whatsAppInstance.findUnique({
          where: { id: instance.id },
        })

        expect(updated?.status).toBe(WhatsAppInstanceStatus.connected)
      })
    })

    describe('powerOn', () => {
      it('should power on instance', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.offline,
            createdById: testUserId,
          },
        })

        mockWhatsAppService.powerOn.mockResolvedValue(undefined)

        await instancesService.powerOn(instance.id, user)

        expect(mockWhatsAppService.powerOn).toHaveBeenCalledWith('instance-1')

        const updated = await prisma.whatsAppInstance.findUnique({
          where: { id: instance.id },
        })

        expect(updated?.status).toBe(WhatsAppInstanceStatus.connecting)
      })
    })

    describe('powerOff', () => {
      it('should power off instance', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            createdById: testUserId,
          },
        })

        mockWhatsAppService.powerOff.mockResolvedValue(undefined)

        await instancesService.powerOff(instance.id, user)

        expect(mockWhatsAppService.powerOff).toHaveBeenCalledWith('instance-1')

        const updated = await prisma.whatsAppInstance.findUnique({
          where: { id: instance.id },
        })

        expect(updated?.status).toBe(WhatsAppInstanceStatus.offline)
      })
    })

    describe('disconnect', () => {
      it('should disconnect instance', async () => {
        const user = createMockUser()

        const instance = await prisma.whatsAppInstance.create({
          data: {
            grupoId: testGrupoId,
            provider: 'zapster',
            providerInstanceId: 'instance-1',
            instanceName: 'Instance Test',
            status: WhatsAppInstanceStatus.connected,
            phoneNumber: '5511999998888',
            createdById: testUserId,
          },
        })

        mockWhatsAppService.disconnect.mockResolvedValue(undefined)

        await instancesService.disconnect(instance.id, user)

        expect(mockWhatsAppService.disconnect).toHaveBeenCalledWith('instance-1')

        const updated = await prisma.whatsAppInstance.findUnique({
          where: { id: instance.id },
        })

        expect(updated?.status).toBe(WhatsAppInstanceStatus.disconnected)
      })
    })
  })
})
