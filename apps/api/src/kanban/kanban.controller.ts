import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { KanbanService } from './kanban.service'
import {
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  KanbanQueryDto,
  CardResponseDto,
  KanbanTagDto,
} from './dto'
import { RequirePermissions, CurrentUser } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Kanban')
@ApiBearerAuth()
@Controller('kanban')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Post('cards')
  @RequirePermissions(AppPermission.KANBAN_INSERT)
  @ApiOperation({ summary: 'Criar card' })
  @ApiResponse({ status: 201, type: CardResponseDto })
  createCard(
    @Body() dto: CreateCardDto,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.createCard(dto, userId)
  }

  @Get('cards')
  @RequirePermissions(AppPermission.KANBAN_SELECT)
  @ApiOperation({ summary: 'Listar cards' })
  @ApiResponse({ status: 200, type: [CardResponseDto] })
  findAllCards(@Query() query: KanbanQueryDto): Promise<CardResponseDto[]> {
    return this.kanbanService.findAllCards(query)
  }

  @Get('cards/:id')
  @RequirePermissions(AppPermission.KANBAN_SELECT)
  @ApiOperation({ summary: 'Buscar card por ID' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card nao encontrado' })
  findCardById(@Param('id') id: string): Promise<CardResponseDto> {
    return this.kanbanService.findCardById(id)
  }

  @Put('cards/:id')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Atualizar card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card nao encontrado' })
  updateCard(
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.updateCard(id, dto, userId)
  }

  @Patch('cards/:id/move')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Mover card para outra coluna' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card nao encontrado' })
  moveCard(
    @Param('id') id: string,
    @Body() dto: MoveCardDto,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.moveCard(id, dto.status, userId)
  }

  @Patch('cards/:id/assign')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Atribuir card a um usuario' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  @ApiResponse({ status: 404, description: 'Card nao encontrado' })
  assignCard(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string | null,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.assignCard(id, assigneeId, userId)
  }

  @Delete('cards/:id')
  @RequirePermissions(AppPermission.KANBAN_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover card (soft delete)' })
  @ApiResponse({ status: 204, description: 'Card removido' })
  @ApiResponse({ status: 404, description: 'Card nao encontrado' })
  deleteCard(
    @Param('id') id: string,
    @Query('hard') hard: string
  ): Promise<void> {
    return this.kanbanService.deleteCard(id, hard === 'true')
  }

  @Post('cards/:id/tags')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Adicionar tag ao card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  addTag(
    @Param('id') id: string,
    @Body() body: { name: string; grupoId: string; color?: string },
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.addTag(id, body.name, body.grupoId, userId, body.color)
  }

  @Delete('cards/:id/tags/:tagId')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Remover tag do card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.removeTag(id, tagId, userId)
  }

  @Get('tags')
  @RequirePermissions(AppPermission.KANBAN_SELECT)
  @ApiOperation({ summary: 'Listar tags do grupo' })
  @ApiResponse({ status: 200, type: [KanbanTagDto] })
  getTags(@Query('grupoId') grupoId: string): Promise<KanbanTagDto[]> {
    return this.kanbanService.getTags(grupoId)
  }

  @Post('cards/:id/links')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Adicionar link ao card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  addLink(
    @Param('id') id: string,
    @Body() body: { title: string; url: string },
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.addLink(id, body.title, body.url, userId)
  }

  @Delete('cards/:id/links/:linkId')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Remover link do card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  removeLink(
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.removeLink(id, linkId, userId)
  }

  @Post('cards/:id/comments')
  @RequirePermissions(AppPermission.KANBAN_UPDATE)
  @ApiOperation({ summary: 'Adicionar comentario ao card' })
  @ApiResponse({ status: 200, type: CardResponseDto })
  addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string
  ): Promise<CardResponseDto> {
    return this.kanbanService.addComment(id, content, userId)
  }
}
