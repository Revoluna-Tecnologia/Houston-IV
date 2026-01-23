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
import { TicketsService } from './tickets.service'
import {
  CreateTicketDto,
  UpdateTicketDto,
  UpdateStatusDto,
  TicketQueryDto,
  TicketResponseDto,
} from './dto'
import { RequirePermissions, CurrentUser } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @RequirePermissions(AppPermission.TICKETS_INSERT)
  @ApiOperation({ summary: 'Criar ticket' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser('id') userId: string
  ): Promise<TicketResponseDto> {
    return this.ticketsService.create(dto, userId)
  }

  @Get()
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Listar tickets' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: TicketQueryDto) {
    return this.ticketsService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Buscar ticket por ID' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  findOne(@Param('id') id: string): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.TICKETS_UPDATE)
  @ApiOperation({ summary: 'Atualizar ticket' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser('id') userId: string
  ): Promise<TicketResponseDto> {
    return this.ticketsService.update(id, dto, userId)
  }

  @Patch(':id/status')
  @RequirePermissions(AppPermission.TICKETS_UPDATE)
  @ApiOperation({ summary: 'Atualizar status do ticket' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'Transicao de status invalida' })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto
  ): Promise<TicketResponseDto> {
    return this.ticketsService.updateStatus(id, dto.status)
  }

  @Patch(':id/assign')
  @RequirePermissions(AppPermission.TICKETS_MANAGE)
  @ApiOperation({ summary: 'Atribuir ticket a um usuario' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string | null
  ): Promise<TicketResponseDto> {
    return this.ticketsService.assign(id, assignedToId)
  }

  @Patch(':id/archive')
  @RequirePermissions(AppPermission.TICKETS_UPDATE)
  @ApiOperation({ summary: 'Arquivar/desarquivar ticket' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  archive(
    @Param('id') id: string,
    @Body('archived') archived: boolean
  ): Promise<TicketResponseDto> {
    return this.ticketsService.archive(id, archived)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.TICKETS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover ticket' })
  @ApiResponse({ status: 204, description: 'Ticket removido' })
  @ApiResponse({ status: 404, description: 'Ticket nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.ticketsService.remove(id)
  }
}
