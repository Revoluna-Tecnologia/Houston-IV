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
import { MedicosService } from './medicos.service'
import {
  CreateMedicoDto,
  UpdateMedicoDto,
  MedicoQueryDto,
  MedicoResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Medicos')
@ApiBearerAuth()
@Controller('medicos')
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}

  @Post()
  @RequirePermissions(AppPermission.MEDICOS_INSERT)
  @ApiOperation({ summary: 'Criar medico' })
  @ApiResponse({ status: 201, type: MedicoResponseDto })
  @ApiResponse({ status: 409, description: 'Medico ja existe' })
  create(@Body() dto: CreateMedicoDto): Promise<MedicoResponseDto> {
    return this.medicosService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.MEDICOS_SELECT)
  @ApiOperation({ summary: 'Listar medicos' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: MedicoQueryDto) {
    return this.medicosService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.MEDICOS_SELECT)
  @ApiOperation({ summary: 'Buscar medico por ID' })
  @ApiResponse({ status: 200, type: MedicoResponseDto })
  @ApiResponse({ status: 404, description: 'Medico nao encontrado' })
  findOne(@Param('id') id: string): Promise<MedicoResponseDto> {
    return this.medicosService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.MEDICOS_UPDATE)
  @ApiOperation({ summary: 'Atualizar medico' })
  @ApiResponse({ status: 200, type: MedicoResponseDto })
  @ApiResponse({ status: 404, description: 'Medico nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicoDto
  ): Promise<MedicoResponseDto> {
    return this.medicosService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.MEDICOS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover medico' })
  @ApiResponse({ status: 204, description: 'Medico removido' })
  @ApiResponse({ status: 404, description: 'Medico nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.medicosService.remove(id)
  }
}
