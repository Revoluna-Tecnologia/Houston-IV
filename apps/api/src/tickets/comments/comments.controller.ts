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
  Query,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { CommentsService } from './comments.service'
import { CreateCommentDto, CommentResponseDto } from './dto'
import { RequirePermissions, CurrentUser } from '../../auth/decorators'
import { AppPermission } from '../../auth/types/auth.types'

@ApiTags('Ticket Comments')
@ApiBearerAuth()
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @RequirePermissions(AppPermission.TICKETS_INSERT)
  @ApiOperation({ summary: 'Criar comentario em ticket' })
  @ApiResponse({ status: 201, type: CommentResponseDto })
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName: string
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(ticketId, dto, userId, userName || 'Usuario')
  }

  @Get()
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Listar comentarios do ticket' })
  @ApiResponse({ status: 200, type: [CommentResponseDto] })
  findAll(
    @Param('ticketId') ticketId: string,
    @Query('includeInternal') includeInternal: string
  ): Promise<CommentResponseDto[]> {
    const internal = includeInternal !== 'false'
    return this.commentsService.findByTicketId(ticketId, internal)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.TICKETS_UPDATE)
  @ApiOperation({ summary: 'Atualizar comentario' })
  @ApiResponse({ status: 200, type: CommentResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissao para editar' })
  @ApiResponse({ status: 404, description: 'Comentario nao encontrado' })
  update(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(id, content, userId)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.TICKETS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover comentario' })
  @ApiResponse({ status: 204, description: 'Comentario removido' })
  @ApiResponse({ status: 403, description: 'Sem permissao para remover' })
  @ApiResponse({ status: 404, description: 'Comentario nao encontrado' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    return this.commentsService.remove(id, userId, false)
  }
}
