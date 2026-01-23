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
import { EscalistasService } from './escalistas.service'
import {
  CreateEscalistaDto,
  UpdateEscalistaDto,
  EscalistaQueryDto,
  EscalistaResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Escalistas')
@ApiBearerAuth()
@Controller('escalistas')
export class EscalistasController {
  constructor(private readonly escalistasService: EscalistasService) {}

  @Post()
  @RequirePermissions(AppPermission.MEMBROS_INSERT)
  @ApiOperation({ summary: 'Criar escalista' })
  @ApiResponse({ status: 201, type: EscalistaResponseDto })
  @ApiResponse({ status: 404, description: 'Medico ou Grupo nao encontrado' })
  @ApiResponse({ status: 409, description: 'Escalista ja existe' })
  create(@Body() dto: CreateEscalistaDto): Promise<EscalistaResponseDto> {
    return this.escalistasService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.MEMBROS_SELECT)
  @ApiOperation({ summary: 'Listar escalistas' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: EscalistaQueryDto) {
    return this.escalistasService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.MEMBROS_SELECT)
  @ApiOperation({ summary: 'Buscar escalista por ID' })
  @ApiResponse({ status: 200, type: EscalistaResponseDto })
  @ApiResponse({ status: 404, description: 'Escalista nao encontrado' })
  findOne(@Param('id') id: string): Promise<EscalistaResponseDto> {
    return this.escalistasService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.MEMBROS_UPDATE)
  @ApiOperation({ summary: 'Atualizar status do escalista' })
  @ApiResponse({ status: 200, type: EscalistaResponseDto })
  @ApiResponse({ status: 400, description: 'Transicao de status invalida' })
  @ApiResponse({ status: 404, description: 'Escalista nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEscalistaDto
  ): Promise<EscalistaResponseDto> {
    return this.escalistasService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.MEMBROS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover escalista' })
  @ApiResponse({ status: 204, description: 'Escalista removido' })
  @ApiResponse({ status: 404, description: 'Escalista nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.escalistasService.remove(id)
  }
}
