/**
 * Instances Controller
 * Endpoints para gerenciamento de instâncias WhatsApp
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { InstancesService } from './instances.service'
import {
  CreateInstanceDto,
  ConnectInstanceDto,
  UpdateInstanceDto,
  InstanceResponseDto,
  QRCodeResponseDto,
  PairingCodeResponseDto,
  ConnectionStatusResponseDto,
} from './dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../../auth/types/auth.types'

@ApiTags('WhatsApp Instances')
@ApiBearerAuth()
@Controller('whatsapp/instances')
export class InstancesController {
  constructor(private readonly service: InstancesService) {}

  @Post()
  @RequirePermissions(AppPermission.WHATSAPP_INSTANCES)
  @ApiOperation({ summary: 'Criar nova instância WhatsApp' })
  @ApiResponse({
    status: 201,
    description: 'Instância criada com sucesso',
    type: InstanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 409, description: 'Grupo já possui instância' })
  create(
    @Body() dto: CreateInstanceDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<InstanceResponseDto> {
    return this.service.create(dto, user)
  }

  @Get()
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Listar instâncias WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Lista de instâncias',
    type: [InstanceResponseDto],
  })
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<InstanceResponseDto[]> {
    return this.service.findAll(user)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Buscar instância por ID' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({
    status: 200,
    description: 'Instância encontrada',
    type: InstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<InstanceResponseDto> {
    return this.service.findOne(id, user)
  }

  @Get('grupo/:grupoId')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Buscar instância por grupo' })
  @ApiParam({ name: 'grupoId', description: 'ID do grupo' })
  @ApiResponse({
    status: 200,
    description: 'Instância do grupo',
    type: InstanceResponseDto,
  })
  findByGrupo(
    @Param('grupoId', ParseUUIDPipe) grupoId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<InstanceResponseDto | null> {
    return this.service.findByGrupo(grupoId, user)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.WHATSAPP_INSTANCES)
  @ApiOperation({ summary: 'Atualizar instância' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({
    status: 200,
    description: 'Instância atualizada',
    type: InstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstanceDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<InstanceResponseDto> {
    return this.service.update(id, dto, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.WHATSAPP_INSTANCES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar instância' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({ status: 204, description: 'Instância deletada' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.delete(id, user)
  }

  @Get(':id/qr')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Obter QR Code para conexão' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({
    status: 200,
    description: 'QR Code gerado',
    type: QRCodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  getQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<QRCodeResponseDto> {
    return this.service.getQRCode(id, user)
  }

  @Post(':id/pairing-code')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Obter código de pareamento' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({
    status: 200,
    description: 'Código de pareamento gerado',
    type: PairingCodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  getPairingCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConnectInstanceDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PairingCodeResponseDto> {
    return this.service.getPairingCode(id, dto, user)
  }

  @Get(':id/status')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @ApiOperation({ summary: 'Obter status de conexão' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({
    status: 200,
    description: 'Status da conexão',
    type: ConnectionStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  getConnectionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ConnectionStatusResponseDto> {
    return this.service.getConnectionStatus(id, user)
  }

  @Post(':id/power-on')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ligar instância' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({ status: 204, description: 'Instância ligada' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  powerOn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.powerOn(id, user)
  }

  @Post(':id/power-off')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desligar instância' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({ status: 204, description: 'Instância desligada' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  powerOff(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.powerOff(id, user)
  }

  @Post(':id/disconnect')
  @RequirePermissions(AppPermission.WHATSAPP_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desconectar WhatsApp (logout)' })
  @ApiParam({ name: 'id', description: 'ID da instância' })
  @ApiResponse({ status: 204, description: 'WhatsApp desconectado' })
  @ApiResponse({ status: 404, description: 'Instância não encontrada' })
  disconnect(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.disconnect(id, user)
  }
}
