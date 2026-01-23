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
import { GruposService } from './grupos.service'
import {
  CreateGrupoDto,
  UpdateGrupoDto,
  GrupoQueryDto,
  GrupoResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Grupos')
@ApiBearerAuth()
@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post()
  @RequirePermissions(AppPermission.GRUPOS_INSERT)
  @ApiOperation({ summary: 'Criar grupo' })
  @ApiResponse({ status: 201, type: GrupoResponseDto })
  @ApiResponse({ status: 409, description: 'Grupo ja existe' })
  create(@Body() dto: CreateGrupoDto): Promise<GrupoResponseDto> {
    return this.gruposService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.GRUPOS_SELECT)
  @ApiOperation({ summary: 'Listar grupos' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: GrupoQueryDto) {
    return this.gruposService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.GRUPOS_SELECT)
  @ApiOperation({ summary: 'Buscar grupo por ID' })
  @ApiResponse({ status: 200, type: GrupoResponseDto })
  @ApiResponse({ status: 404, description: 'Grupo nao encontrado' })
  findOne(@Param('id') id: string): Promise<GrupoResponseDto> {
    return this.gruposService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.GRUPOS_UPDATE)
  @ApiOperation({ summary: 'Atualizar grupo' })
  @ApiResponse({ status: 200, type: GrupoResponseDto })
  @ApiResponse({ status: 404, description: 'Grupo nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGrupoDto
  ): Promise<GrupoResponseDto> {
    return this.gruposService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.GRUPOS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover grupo' })
  @ApiResponse({ status: 204, description: 'Grupo removido' })
  @ApiResponse({ status: 404, description: 'Grupo nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.gruposService.remove(id)
  }
}
