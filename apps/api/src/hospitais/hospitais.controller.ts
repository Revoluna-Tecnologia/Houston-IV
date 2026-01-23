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
import { HospitaisService } from './hospitais.service'
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalQueryDto,
  HospitalResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Hospitais')
@ApiBearerAuth()
@Controller('hospitais')
export class HospitaisController {
  constructor(private readonly hospitaisService: HospitaisService) {}

  @Post()
  @RequirePermissions(AppPermission.HOSPITAIS_INSERT)
  @ApiOperation({ summary: 'Criar hospital' })
  @ApiResponse({ status: 201, type: HospitalResponseDto })
  @ApiResponse({ status: 409, description: 'Hospital ja existe' })
  create(@Body() dto: CreateHospitalDto): Promise<HospitalResponseDto> {
    return this.hospitaisService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.HOSPITAIS_SELECT)
  @ApiOperation({ summary: 'Listar hospitais' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: HospitalQueryDto) {
    return this.hospitaisService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_SELECT)
  @ApiOperation({ summary: 'Buscar hospital por ID' })
  @ApiResponse({ status: 200, type: HospitalResponseDto })
  @ApiResponse({ status: 404, description: 'Hospital nao encontrado' })
  findOne(@Param('id') id: string): Promise<HospitalResponseDto> {
    return this.hospitaisService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_UPDATE)
  @ApiOperation({ summary: 'Atualizar hospital' })
  @ApiResponse({ status: 200, type: HospitalResponseDto })
  @ApiResponse({ status: 404, description: 'Hospital nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHospitalDto
  ): Promise<HospitalResponseDto> {
    return this.hospitaisService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover hospital' })
  @ApiResponse({ status: 204, description: 'Hospital removido' })
  @ApiResponse({ status: 404, description: 'Hospital nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.hospitaisService.remove(id)
  }
}
