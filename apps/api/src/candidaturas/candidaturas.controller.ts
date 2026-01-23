import {
  Controller,
  Get,
  Post,
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
import { CandidaturasService } from './candidaturas.service'
import {
  CreateCandidaturaDto,
  CandidaturaQueryDto,
  CandidaturaResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Candidaturas')
@ApiBearerAuth()
@Controller('candidaturas')
export class CandidaturasController {
  constructor(private readonly candidaturasService: CandidaturasService) {}

  @Post()
  @RequirePermissions(AppPermission.CANDIDATURAS_INSERT)
  @ApiOperation({ summary: 'Criar candidatura' })
  @ApiResponse({ status: 201, type: CandidaturaResponseDto })
  @ApiResponse({ status: 400, description: 'Vaga nao esta aberta' })
  @ApiResponse({ status: 409, description: 'Candidatura ja existe' })
  create(@Body() dto: CreateCandidaturaDto): Promise<CandidaturaResponseDto> {
    return this.candidaturasService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.CANDIDATURAS_SELECT)
  @ApiOperation({ summary: 'Listar candidaturas' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: CandidaturaQueryDto) {
    return this.candidaturasService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.CANDIDATURAS_SELECT)
  @ApiOperation({ summary: 'Buscar candidatura por ID' })
  @ApiResponse({ status: 200, type: CandidaturaResponseDto })
  @ApiResponse({ status: 404, description: 'Candidatura nao encontrada' })
  findOne(@Param('id') id: string): Promise<CandidaturaResponseDto> {
    return this.candidaturasService.findOne(id)
  }

  @Patch(':id/aprovar')
  @RequirePermissions(AppPermission.CANDIDATURAS_UPDATE)
  @ApiOperation({ summary: 'Aprovar candidatura' })
  @ApiResponse({ status: 200, type: CandidaturaResponseDto })
  @ApiResponse({ status: 400, description: 'Candidatura nao pode ser aprovada' })
  @ApiResponse({ status: 404, description: 'Candidatura nao encontrada' })
  approve(@Param('id') id: string): Promise<CandidaturaResponseDto> {
    return this.candidaturasService.approve(id)
  }

  @Patch(':id/rejeitar')
  @RequirePermissions(AppPermission.CANDIDATURAS_UPDATE)
  @ApiOperation({ summary: 'Rejeitar candidatura' })
  @ApiResponse({ status: 200, type: CandidaturaResponseDto })
  @ApiResponse({ status: 400, description: 'Candidatura nao pode ser rejeitada' })
  @ApiResponse({ status: 404, description: 'Candidatura nao encontrada' })
  reject(@Param('id') id: string): Promise<CandidaturaResponseDto> {
    return this.candidaturasService.reject(id)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.CANDIDATURAS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover candidatura' })
  @ApiResponse({ status: 204, description: 'Candidatura removida' })
  @ApiResponse({ status: 404, description: 'Candidatura nao encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.candidaturasService.remove(id)
  }
}
