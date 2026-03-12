/**
 * Instances Service
 * Lógica de negócio para gerenciamento de instâncias WhatsApp
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { WhatsAppInstanceStatus, Prisma } from "../../generated/prisma/client";
import { InstancesRepository } from "./instances.repository";
import { WhatsAppService } from "../whatsapp.service";
import {
  CreateInstanceDto,
  ConnectInstanceDto,
  UpdateInstanceDto,
  InstanceResponseDto,
  QRCodeResponseDto,
  PairingCodeResponseDto,
  ConnectionStatusResponseDto,
} from "./dto";
import { AuthenticatedUser } from "../../auth/types/auth.types";
import { ConnectionStatus } from "../types";

@Injectable()
export class InstancesService {
  private readonly logger = new Logger(InstancesService.name);

  constructor(
    private readonly repository: InstancesRepository,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async create(
    dto: CreateInstanceDto,
    user: AuthenticatedUser,
  ): Promise<InstanceResponseDto> {
    // Verificar se usuário tem acesso ao grupo
    if (!user.grupoIds.includes(dto.grupoId)) {
      throw new ForbiddenException("Sem acesso ao grupo");
    }

    // Verificar se já existe instância para o grupo
    const exists = await this.repository.existsForGrupo(dto.grupoId);
    if (exists) {
      throw new ConflictException("Grupo já possui uma instância WhatsApp");
    }

    // Criar instância no provider
    const providerInstance = await this.whatsappService.createInstance(
      dto.name,
    );

    // Salvar no banco
    const instance = await this.repository.create({
      grupoId: dto.grupoId,
      provider: this.whatsappService.getActiveProvider(),
      providerInstanceId: providerInstance.id,
      instanceName: dto.name,
      status: this.mapProviderStatus(providerInstance.status),
      phoneNumber: providerInstance.phoneNumber,
      metadata: providerInstance.metadata as Prisma.InputJsonValue,
      createdById: user.id,
    });

    this.logger.log(
      `Instance created: ${instance.id} for grupo ${dto.grupoId}`,
    );

    return this.toResponseDto(instance);
  }

  async findAll(user: AuthenticatedUser): Promise<InstanceResponseDto[]> {
    const instances = await this.repository.findAll(user.grupoIds);
    return instances.map((i) => this.toResponseDto(i));
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<InstanceResponseDto> {
    const instance = await this.findInstanceOrFail(id, user);
    return this.toResponseDto(instance);
  }

  async findByGrupo(
    grupoId: string,
    user: AuthenticatedUser,
  ): Promise<InstanceResponseDto | null> {
    if (!user.grupoIds.includes(grupoId)) {
      throw new ForbiddenException("Sem acesso ao grupo");
    }

    const instance = await this.repository.findByGrupoId(grupoId);
    return instance ? this.toResponseDto(instance) : null;
  }

  async update(
    id: string,
    dto: UpdateInstanceDto,
    user: AuthenticatedUser,
  ): Promise<InstanceResponseDto> {
    // Valida que instância existe e usuário tem acesso
    await this.findInstanceOrFail(id, user);

    const updated = await this.repository.update(id, {
      instanceName: dto.name,
    });

    this.logger.log(`Instance updated: ${id}`);

    return this.toResponseDto(updated);
  }

  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const instance = await this.findInstanceOrFail(id, user);

    // Desconectar e deletar no provider
    try {
      await this.whatsappService.disconnect(instance.providerInstanceId);
      await this.whatsappService.deleteInstance(instance.providerInstanceId);
    } catch (error) {
      this.logger.warn(`Failed to delete instance in provider: ${error}`);
    }

    // Deletar no banco
    await this.repository.delete(id);

    this.logger.log(`Instance deleted: ${id}`);
  }

  async getQRCode(
    id: string,
    user: AuthenticatedUser,
  ): Promise<QRCodeResponseDto> {
    const instance = await this.findInstanceOrFail(id, user);

    // Ligar a instância se estiver offline
    if (instance.status === WhatsAppInstanceStatus.offline) {
      await this.whatsappService.powerOn(instance.providerInstanceId);
    }

    const qrResponse = await this.whatsappService.getQRCode(
      instance.providerInstanceId,
    );

    // Atualizar status para connecting
    await this.repository.updateStatus(id, WhatsAppInstanceStatus.connecting);

    return {
      qr: qrResponse.qr,
      expiresAt: qrResponse.expiresAt,
    };
  }

  async getPairingCode(
    id: string,
    dto: ConnectInstanceDto,
    user: AuthenticatedUser,
  ): Promise<PairingCodeResponseDto> {
    const instance = await this.findInstanceOrFail(id, user);

    if (!dto.phoneNumber) {
      throw new Error(
        "Número de telefone é obrigatório para código de pareamento",
      );
    }

    // Ligar a instância se estiver offline
    if (instance.status === WhatsAppInstanceStatus.offline) {
      await this.whatsappService.powerOn(instance.providerInstanceId);
    }

    const codeResponse = await this.whatsappService.getPairingCode(
      instance.providerInstanceId,
      dto.phoneNumber,
    );

    // Atualizar status para connecting
    await this.repository.updateStatus(id, WhatsAppInstanceStatus.connecting);

    return {
      code: codeResponse.code,
      expiresAt: codeResponse.expiresAt,
    };
  }

  async getConnectionStatus(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ConnectionStatusResponseDto> {
    const instance = await this.findInstanceOrFail(id, user);

    // Buscar status atual do provider
    const providerStatus = await this.whatsappService.getConnectionStatus(
      instance.providerInstanceId,
    );

    // Atualizar status no banco se diferente
    const newStatus = this.mapProviderStatus(providerStatus);
    if (instance.status !== newStatus) {
      await this.repository.updateStatus(id, newStatus);
    }

    return {
      status: newStatus,
      phoneNumber: instance.phoneNumber || undefined,
      isConnected: providerStatus === ConnectionStatus.CONNECTED,
    };
  }

  async powerOn(id: string, user: AuthenticatedUser): Promise<void> {
    const instance = await this.findInstanceOrFail(id, user);

    await this.whatsappService.powerOn(instance.providerInstanceId);
    await this.repository.updateStatus(id, WhatsAppInstanceStatus.connecting);

    this.logger.log(`Instance powered on: ${id}`);
  }

  async powerOff(id: string, user: AuthenticatedUser): Promise<void> {
    const instance = await this.findInstanceOrFail(id, user);

    await this.whatsappService.powerOff(instance.providerInstanceId);
    await this.repository.updateStatus(id, WhatsAppInstanceStatus.offline);

    this.logger.log(`Instance powered off: ${id}`);
  }

  async disconnect(id: string, user: AuthenticatedUser): Promise<void> {
    const instance = await this.findInstanceOrFail(id, user);

    await this.whatsappService.disconnect(instance.providerInstanceId);
    await this.repository.updateStatus(
      id,
      WhatsAppInstanceStatus.disconnected,
      undefined,
    );

    this.logger.log(`Instance disconnected: ${id}`);
  }

  async refreshStatus(id: string): Promise<void> {
    const instance = await this.repository.findById(id);
    if (!instance) return;

    try {
      const providerStatus = await this.whatsappService.getConnectionStatus(
        instance.providerInstanceId,
      );

      const providerInstance = await this.whatsappService.getInstance(
        instance.providerInstanceId,
      );

      await this.repository.updateStatus(
        id,
        this.mapProviderStatus(providerStatus),
        providerInstance.phoneNumber,
      );
    } catch (error) {
      this.logger.warn(`Failed to refresh status for instance ${id}: ${error}`);
      await this.repository.updateStatus(id, WhatsAppInstanceStatus.offline);
    }
  }

  // === Private Methods ===

  private async findInstanceOrFail(id: string, user: AuthenticatedUser) {
    const instance = await this.repository.findById(id);
    if (!instance) {
      throw new NotFoundException("Instância não encontrada");
    }

    if (!user.grupoIds.includes(instance.grupoId)) {
      throw new ForbiddenException("Sem acesso à instância");
    }

    return instance;
  }

  private mapProviderStatus(status: ConnectionStatus): WhatsAppInstanceStatus {
    const statusMap: Record<ConnectionStatus, WhatsAppInstanceStatus> = {
      [ConnectionStatus.CONNECTED]: WhatsAppInstanceStatus.connected,
      [ConnectionStatus.DISCONNECTED]: WhatsAppInstanceStatus.disconnected,
      [ConnectionStatus.CONNECTING]: WhatsAppInstanceStatus.connecting,
      [ConnectionStatus.OFFLINE]: WhatsAppInstanceStatus.offline,
    };
    return statusMap[status] || WhatsAppInstanceStatus.offline;
  }

  private toResponseDto(instance: {
    id: string;
    grupoId: string;
    provider: string;
    providerInstanceId: string;
    instanceName: string;
    status: WhatsAppInstanceStatus;
    phoneNumber: string | null;
    metadata: unknown;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): InstanceResponseDto {
    return {
      id: instance.id,
      grupoId: instance.grupoId,
      provider: instance.provider,
      providerInstanceId: instance.providerInstanceId,
      instanceName: instance.instanceName,
      status: instance.status,
      phoneNumber: instance.phoneNumber || undefined,
      metadata: instance.metadata as Record<string, unknown> | undefined,
      createdById: instance.createdById,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    };
  }
}
