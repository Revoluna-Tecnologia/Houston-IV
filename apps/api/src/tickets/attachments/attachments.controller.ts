import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { AttachmentsService } from './attachments.service'
import { AttachmentResponseDto } from './dto'
import { RequirePermissions } from '../../auth/decorators'
import { AppPermission } from '../../auth/types/auth.types'

@ApiTags('Ticket Attachments')
@ApiBearerAuth()
@Controller('tickets/:ticketId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @RequirePermissions(AppPermission.TICKETS_INSERT)
  @ApiOperation({ summary: 'Registrar anexo em ticket' })
  @ApiResponse({ status: 201, type: AttachmentResponseDto })
  create(
    @Param('ticketId') ticketId: string,
    @Body() data: { filename: string; originalName: string; mimeType: string; size: number; url: string; key: string }
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.create(ticketId, data)
  }

  @Get()
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Listar anexos do ticket' })
  @ApiResponse({ status: 200, type: [AttachmentResponseDto] })
  findAll(@Param('ticketId') ticketId: string): Promise<AttachmentResponseDto[]> {
    return this.attachmentsService.findByTicketId(ticketId)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Buscar anexo por ID' })
  @ApiResponse({ status: 200, type: AttachmentResponseDto })
  @ApiResponse({ status: 404, description: 'Anexo nao encontrado' })
  findOne(@Param('id') id: string): Promise<AttachmentResponseDto> {
    return this.attachmentsService.findOne(id)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.TICKETS_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover anexo' })
  @ApiResponse({ status: 200, description: 'Retorna a key para deletar do storage' })
  @ApiResponse({ status: 404, description: 'Anexo nao encontrado' })
  remove(@Param('id') id: string): Promise<{ key: string }> {
    return this.attachmentsService.remove(id)
  }
}
