import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { ConversationsService } from './conversations.service'
import {
  CreateConversationDto,
  UpdateConversationDto,
  ConversationQueryDto,
  ConversationResponseDto,
  ConversationListResponseDto,
  ParticipantResponseDto,
  AddParticipantDto,
} from './dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../../auth/types/auth.types'

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Post()
  @RequirePermissions(AppPermission.COMUNICACAO_INSERT)
  @ApiOperation({ summary: 'Criar nova conversa' })
  @ApiResponse({
    status: 201,
    description: 'Conversa criada com sucesso',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ConversationResponseDto> {
    return this.service.create(dto, user)
  }

  @Get()
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Listar conversas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas',
    type: ConversationListResponseDto,
  })
  findAll(
    @Query() query: ConversationQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.findAll(query, user)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Buscar conversa por ID' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({
    status: 200,
    description: 'Conversa encontrada',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ConversationResponseDto> {
    return this.service.findOne(id, user)
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Atualizar conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({
    status: 200,
    description: 'Conversa atualizada',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sem permissão (não é admin)' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ConversationResponseDto> {
    return this.service.update(id, dto, user)
  }

  @Patch(':id/archive')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Arquivar/desarquivar conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 204, description: 'Conversa arquivada/desarquivada' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('archive') archive: boolean,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.archive(id, archive, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 204, description: 'Conversa deletada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.remove(id, user)
  }

  @Post(':id/participants')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Adicionar participante ao grupo' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({
    status: 201,
    description: 'Participante adicionado',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Conversa direta ou participante já existe' })
  @ApiResponse({ status: 403, description: 'Não é admin do grupo' })
  addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddParticipantDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ParticipantResponseDto> {
    return this.service.addParticipant(id, dto, user)
  }

  @Delete(':id/participants/:participantId')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover participante do grupo' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  @ApiResponse({ status: 204, description: 'Participante removido' })
  @ApiResponse({ status: 400, description: 'Conversa direta' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  removeParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.removeParticipant(id, participantId, user)
  }
}
