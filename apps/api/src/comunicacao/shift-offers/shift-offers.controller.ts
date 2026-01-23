/**
 * ShiftOffers Controller
 * Endpoints para ofertas de plantão via chat
 */

import {
  Controller,
  Get,
  Post,
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
import { ShiftOffersService } from './shift-offers.service'
import {
  CreateShiftOfferDto,
  RespondShiftOfferDto,
  ShiftOfferQueryDto,
  ShiftOfferResponseDto,
  ShiftOfferListResponseDto,
} from './dto'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../../auth/types/auth.types'

@ApiTags('Shift Offers')
@ApiBearerAuth()
@Controller('shift-offers')
export class ShiftOffersController {
  constructor(private readonly service: ShiftOffersService) {}

  @Post()
  @RequirePermissions(AppPermission.COMUNICACAO_INSERT, AppPermission.VAGAS_SELECT)
  @ApiOperation({ summary: 'Criar oferta de plantão' })
  @ApiResponse({
    status: 201,
    description: 'Oferta criada',
    type: ShiftOfferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() dto: CreateShiftOfferDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ShiftOfferResponseDto> {
    return this.service.create(dto, user)
  }

  @Get()
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Listar ofertas de plantão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas',
    type: ShiftOfferListResponseDto,
  })
  findAll(
    @Query() query: ShiftOfferQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ShiftOfferListResponseDto> {
    return this.service.findAll(query, user)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_SELECT)
  @ApiOperation({ summary: 'Buscar oferta por ID' })
  @ApiParam({ name: 'id', description: 'ID da oferta' })
  @ApiResponse({
    status: 200,
    description: 'Oferta encontrada',
    type: ShiftOfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ShiftOfferResponseDto> {
    return this.service.findOne(id, user)
  }

  @Post(':id/respond')
  @RequirePermissions(AppPermission.COMUNICACAO_UPDATE)
  @ApiOperation({ summary: 'Responder oferta (aceitar/rejeitar)' })
  @ApiParam({ name: 'id', description: 'ID da oferta' })
  @ApiResponse({
    status: 200,
    description: 'Oferta respondida',
    type: ShiftOfferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Oferta não está pendente ou expirou' })
  @ApiResponse({ status: 403, description: 'Apenas o destinatário pode responder' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondShiftOfferDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ShiftOfferResponseDto> {
    return this.service.respond(id, dto, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.COMUNICACAO_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar oferta' })
  @ApiParam({ name: 'id', description: 'ID da oferta' })
  @ApiResponse({ status: 204, description: 'Oferta cancelada' })
  @ApiResponse({ status: 400, description: 'Oferta não está pendente' })
  @ApiResponse({ status: 403, description: 'Apenas o remetente pode cancelar' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.service.cancel(id, user)
  }
}
