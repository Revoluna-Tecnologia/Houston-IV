import {
  Controller,
  Get,
  Post,
  Put,
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
import { CheckinCheckoutService } from './checkin-checkout.service'
import {
  CreateCheckinCheckoutDto,
  UpdateCheckinCheckoutDto,
  CheckinCheckoutQueryDto,
  CheckinCheckoutResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Checkin/Checkout')
@ApiBearerAuth()
@Controller('checkin-checkout')
export class CheckinCheckoutController {
  constructor(private readonly service: CheckinCheckoutService) {}

  @Post()
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_INSERT)
  @ApiOperation({ summary: 'Criar registro de checkin/checkout' })
  @ApiResponse({ status: 201, type: CheckinCheckoutResponseDto })
  @ApiResponse({ status: 409, description: 'Registro ja existe' })
  create(@Body() dto: CreateCheckinCheckoutDto): Promise<CheckinCheckoutResponseDto> {
    return this.service.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_SELECT)
  @ApiOperation({ summary: 'Listar registros de checkin/checkout' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: CheckinCheckoutQueryDto) {
    return this.service.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_SELECT)
  @ApiOperation({ summary: 'Buscar registro por ID' })
  @ApiResponse({ status: 200, type: CheckinCheckoutResponseDto })
  @ApiResponse({ status: 404, description: 'Registro nao encontrado' })
  findOne(@Param('id') id: string): Promise<CheckinCheckoutResponseDto> {
    return this.service.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_UPDATE)
  @ApiOperation({ summary: 'Atualizar registro' })
  @ApiResponse({ status: 200, type: CheckinCheckoutResponseDto })
  @ApiResponse({ status: 404, description: 'Registro nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCheckinCheckoutDto
  ): Promise<CheckinCheckoutResponseDto> {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover registro' })
  @ApiResponse({ status: 204, description: 'Registro removido' })
  @ApiResponse({ status: 404, description: 'Registro nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id)
  }

  @Post(':id/checkin')
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_UPDATE)
  @ApiOperation({ summary: 'Registrar checkin' })
  @ApiResponse({ status: 200, type: CheckinCheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'Checkin ja registrado' })
  @ApiResponse({ status: 404, description: 'Registro nao encontrado' })
  checkin(@Param('id') id: string): Promise<CheckinCheckoutResponseDto> {
    return this.service.checkin(id)
  }

  @Post(':id/checkout')
  @RequirePermissions(AppPermission.CHECKIN_CHECKOUT_UPDATE)
  @ApiOperation({ summary: 'Registrar checkout' })
  @ApiResponse({ status: 200, type: CheckinCheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'Checkin nao registrado ou checkout ja registrado' })
  @ApiResponse({ status: 404, description: 'Registro nao encontrado' })
  checkout(@Param('id') id: string): Promise<CheckinCheckoutResponseDto> {
    return this.service.checkout(id)
  }
}
