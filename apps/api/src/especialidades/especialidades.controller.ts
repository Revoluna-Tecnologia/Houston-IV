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
import { EspecialidadesService } from './especialidades.service'
import {
  CreateEspecialidadeDto,
  UpdateEspecialidadeDto,
  EspecialidadeQueryDto,
  EspecialidadeResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Especialidades')
@ApiBearerAuth()
@Controller('especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Post()
  @RequirePermissions(AppPermission.MEDICOS_INSERT)
  @ApiOperation({ summary: 'Criar especialidade' })
  @ApiResponse({ status: 201, type: EspecialidadeResponseDto })
  @ApiResponse({ status: 409, description: 'Especialidade ja existe' })
  create(@Body() dto: CreateEspecialidadeDto): Promise<EspecialidadeResponseDto> {
    return this.especialidadesService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.MEDICOS_SELECT)
  @ApiOperation({ summary: 'Listar especialidades' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: EspecialidadeQueryDto) {
    return this.especialidadesService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.MEDICOS_SELECT)
  @ApiOperation({ summary: 'Buscar especialidade por ID' })
  @ApiResponse({ status: 200, type: EspecialidadeResponseDto })
  @ApiResponse({ status: 404, description: 'Especialidade nao encontrada' })
  findOne(@Param('id') id: string): Promise<EspecialidadeResponseDto> {
    return this.especialidadesService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.MEDICOS_UPDATE)
  @ApiOperation({ summary: 'Atualizar especialidade' })
  @ApiResponse({ status: 200, type: EspecialidadeResponseDto })
  @ApiResponse({ status: 404, description: 'Especialidade nao encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEspecialidadeDto
  ): Promise<EspecialidadeResponseDto> {
    return this.especialidadesService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.MEDICOS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover especialidade' })
  @ApiResponse({ status: 204, description: 'Especialidade removida' })
  @ApiResponse({ status: 404, description: 'Especialidade nao encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.especialidadesService.remove(id)
  }
}
