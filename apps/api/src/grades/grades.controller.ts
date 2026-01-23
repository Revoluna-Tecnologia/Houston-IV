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
import { GradesService } from './grades.service'
import {
  CreateGradeDto,
  UpdateGradeDto,
  GradeQueryDto,
  GradeResponseDto,
  CreateTimeSlotsDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

class GenerateVagasDto {
  especialidadeId!: string
  valor!: number
}

@ApiTags('Grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  @ApiOperation({ summary: 'Criar grade' })
  @ApiResponse({ status: 201, type: GradeResponseDto })
  create(@Body() dto: CreateGradeDto): Promise<GradeResponseDto> {
    return this.gradesService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  @ApiOperation({ summary: 'Listar grades' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: GradeQueryDto) {
    return this.gradesService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  @ApiOperation({ summary: 'Buscar grade por ID' })
  @ApiResponse({ status: 200, type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  findOne(@Param('id') id: string): Promise<GradeResponseDto> {
    return this.gradesService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  @ApiOperation({ summary: 'Atualizar grade' })
  @ApiResponse({ status: 200, type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.VAGAS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover grade' })
  @ApiResponse({ status: 204, description: 'Grade removida' })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.gradesService.remove(id)
  }

  @Post(':id/time-slots')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  @ApiOperation({ summary: 'Adicionar time slots a grade' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  addTimeSlots(
    @Param('id') id: string,
    @Body() dto: CreateTimeSlotsDto
  ) {
    return this.gradesService.addTimeSlots(id, dto.timeSlots)
  }

  @Post(':id/publish')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  @ApiOperation({ summary: 'Publicar grade' })
  @ApiResponse({ status: 200, type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  publish(@Param('id') id: string): Promise<GradeResponseDto> {
    return this.gradesService.publish(id)
  }

  @Post(':id/generate-vagas')
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  @ApiOperation({ summary: 'Gerar vagas a partir da grade' })
  @ApiResponse({ status: 200, description: 'Numero de vagas geradas' })
  @ApiResponse({ status: 404, description: 'Grade nao encontrada' })
  generateVagas(
    @Param('id') id: string,
    @Body() dto: GenerateVagasDto
  ): Promise<number> {
    return this.gradesService.generateVagas(id, dto.especialidadeId, dto.valor)
  }
}
