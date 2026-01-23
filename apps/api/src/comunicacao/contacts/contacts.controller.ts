/**
 * Contacts Controller
 * Endpoints para gerenciamento de contatos
 */

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
  ParseUUIDPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { ContactsService } from './contacts.service'
import {
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
  ContactResponseDto,
  ContactListResponseDto,
} from './dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../../auth/types/auth.types'

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Post()
  @RequirePermissions(AppPermission.COMUNICACAO_INSERT)
  @ApiOperation({ summary: 'Criar contato' })
  @ApiResponse({
    status: 201,
    description: 'Contato criado',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Contato já existe' })
  create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    return this.service.create(dto, user)
  }

  @Get()
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Listar contatos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contatos',
    type: ContactListResponseDto,
  })
  findAll(
    @Query() query: ContactQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactListResponseDto> {
    return this.service.findAll(query, user)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Buscar contato por ID' })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({
    status: 200,
    description: 'Contato encontrado',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    return this.service.findOne(id, user)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Atualizar contato' })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({
    status: 200,
    description: 'Contato atualizado',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    return this.service.update(id, dto, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar contato' })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({ status: 204, description: 'Contato deletado' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.delete(id, user)
  }

  @Patch(':id/favorite')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Alternar favorito' })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({
    status: 200,
    description: 'Status de favorito alterado',
    type: ContactResponseDto,
  })
  toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    return this.service.toggleFavorite(id, user)
  }

  @Patch(':id/block')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Alternar bloqueio' })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({
    status: 200,
    description: 'Status de bloqueio alterado',
    type: ContactResponseDto,
  })
  toggleBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    return this.service.toggleBlock(id, user)
  }
}
