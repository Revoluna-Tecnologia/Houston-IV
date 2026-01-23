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
import { MessagesService } from './messages.service'
import {
  SendMessageDto,
  MessageQueryDto,
  MessageResponseDto,
  MessageListResponseDto,
} from './dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../../auth/types/auth.types'

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post()
  @RequirePermissions(AppPermission.COMUNICACAO_INSERT)
  @ApiOperation({ summary: 'Enviar mensagem' })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Não é participante da conversa' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  send(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<MessageResponseDto> {
    return this.service.send(dto, user)
  }

  @Get('conversation/:conversationId')
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens',
    type: MessageListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Não é participante da conversa' })
  findByConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: MessageQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.findByConversation(conversationId, query, user)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Buscar mensagem por ID' })
  @ApiParam({ name: 'id', description: 'ID da mensagem' })
  @ApiResponse({
    status: 200,
    description: 'Mensagem encontrada',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<MessageResponseDto> {
    return this.service.findOne(id, user)
  }

  @Patch('conversation/:conversationId/read')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar mensagens como lidas' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa' })
  @ApiResponse({ status: 204, description: 'Mensagens marcadas como lidas' })
  @ApiResponse({ status: 403, description: 'Não é participante da conversa' })
  markAsRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.markAsRead(conversationId, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar mensagem (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da mensagem' })
  @ApiResponse({ status: 204, description: 'Mensagem deletada' })
  @ApiResponse({ status: 403, description: 'Apenas o remetente pode deletar' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.delete(id, user)
  }
}
