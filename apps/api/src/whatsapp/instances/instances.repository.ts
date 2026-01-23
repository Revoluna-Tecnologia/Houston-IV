/**
 * Instances Repository
 * Responsável pelo acesso a dados das instâncias WhatsApp
 */

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { WhatsAppInstance, WhatsAppInstanceStatus, Prisma } from '@prisma/client'

export interface CreateInstanceData {
  grupoId: string
  provider?: string
  providerInstanceId: string
  instanceName: string
  status?: WhatsAppInstanceStatus
  phoneNumber?: string
  metadata?: Prisma.InputJsonValue
  createdById: string
}

export interface UpdateInstanceData {
  instanceName?: string
  status?: WhatsAppInstanceStatus
  phoneNumber?: string
  metadata?: Prisma.InputJsonValue
}

@Injectable()
export class InstancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInstanceData): Promise<WhatsAppInstance> {
    return this.prisma.whatsAppInstance.create({
      data: {
        grupoId: data.grupoId,
        provider: data.provider || 'zapster',
        providerInstanceId: data.providerInstanceId,
        instanceName: data.instanceName,
        status: data.status || WhatsAppInstanceStatus.disconnected,
        phoneNumber: data.phoneNumber,
        metadata: data.metadata || {},
        createdById: data.createdById,
      },
    })
  }

  async findById(id: string): Promise<WhatsAppInstance | null> {
    return this.prisma.whatsAppInstance.findUnique({
      where: { id },
    })
  }

  async findByGrupoId(grupoId: string): Promise<WhatsAppInstance | null> {
    return this.prisma.whatsAppInstance.findUnique({
      where: { grupoId },
    })
  }

  async findByProviderInstanceId(providerInstanceId: string): Promise<WhatsAppInstance | null> {
    return this.prisma.whatsAppInstance.findFirst({
      where: { providerInstanceId },
    })
  }

  async findAll(grupoIds?: string[]): Promise<WhatsAppInstance[]> {
    const where: Prisma.WhatsAppInstanceWhereInput = {}

    if (grupoIds && grupoIds.length > 0) {
      where.grupoId = { in: grupoIds }
    }

    return this.prisma.whatsAppInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async update(id: string, data: UpdateInstanceData): Promise<WhatsAppInstance> {
    return this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        instanceName: data.instanceName,
        status: data.status,
        phoneNumber: data.phoneNumber,
        metadata: data.metadata,
      },
    })
  }

  async updateStatus(id: string, status: WhatsAppInstanceStatus, phoneNumber?: string): Promise<WhatsAppInstance> {
    return this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status,
        phoneNumber,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.whatsAppInstance.delete({
      where: { id },
    })
  }

  async existsForGrupo(grupoId: string): Promise<boolean> {
    const count = await this.prisma.whatsAppInstance.count({
      where: { grupoId },
    })
    return count > 0
  }
}
