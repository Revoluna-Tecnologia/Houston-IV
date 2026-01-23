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
import { VagasService } from './vagas.service'
import {
  CreateVagaDto,
  UpdateVagaDto,
  UpdateStatusDto,
  VagaQueryDto,
  VagaResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Vagas')
@ApiBearerAuth()
@Controller('vagas')
export class VagasController {
  constructor(private readonly vagasService: VagasService) {}

  @Post()
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  @ApiOperation({ summary: 'Criar vaga' })
  @ApiResponse({ status: 201, type: VagaResponseDto })
  @ApiResponse({ status: 409, description: 'Conflito de horario' })
  create(@Body() dto: CreateVagaDto): Promise<VagaResponseDto> {
    return this.vagasService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  @ApiOperation({ summary: 'Listar vagas' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: VagaQueryDto) {
    return this.vagasService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  @ApiOperation({ summary: 'Buscar vaga por ID' })
  @ApiResponse({ status: 200, type: VagaResponseDto })
  @ApiResponse({ status: 404, description: 'Vaga nao encontrada' })
  findOne(@Param('id') id: string): Promise<VagaResponseDto> {
    return this.vagasService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  @ApiOperation({ summary: 'Atualizar vaga' })
  @ApiResponse({ status: 200, type: VagaResponseDto })
  @ApiResponse({ status: 404, description: 'Vaga nao encontrada' })
  @ApiResponse({ status: 409, description: 'Conflito de horario' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVagaDto
  ): Promise<VagaResponseDto> {
    return this.vagasService.update(id, dto)
  }

  @Patch(':id/status')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  @ApiOperation({ summary: 'Atualizar status da vaga' })
  @ApiResponse({ status: 200, type: VagaResponseDto })
  @ApiResponse({ status: 400, description: 'Transicao de status invalida' })
  @ApiResponse({ status: 404, description: 'Vaga nao encontrada' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto
  ): Promise<VagaResponseDto> {
    return this.vagasService.updateStatus(id, dto.status)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.VAGAS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover vaga' })
  @ApiResponse({ status: 204, description: 'Vaga removida' })
  @ApiResponse({ status: 404, description: 'Vaga nao encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.vagasService.remove(id)
  }
}
