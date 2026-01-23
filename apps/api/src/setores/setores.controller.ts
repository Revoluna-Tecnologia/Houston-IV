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
import { SetoresService } from './setores.service'
import {
  CreateSetorDto,
  UpdateSetorDto,
  SetorQueryDto,
  SetorResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Setores')
@ApiBearerAuth()
@Controller('setores')
export class SetoresController {
  constructor(private readonly setoresService: SetoresService) {}

  @Post()
  @RequirePermissions(AppPermission.HOSPITAIS_INSERT)
  @ApiOperation({ summary: 'Criar setor' })
  @ApiResponse({ status: 201, type: SetorResponseDto })
  @ApiResponse({ status: 409, description: 'Setor ja existe' })
  create(@Body() dto: CreateSetorDto): Promise<SetorResponseDto> {
    return this.setoresService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.HOSPITAIS_SELECT)
  @ApiOperation({ summary: 'Listar setores' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: SetorQueryDto) {
    return this.setoresService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_SELECT)
  @ApiOperation({ summary: 'Buscar setor por ID' })
  @ApiResponse({ status: 200, type: SetorResponseDto })
  @ApiResponse({ status: 404, description: 'Setor nao encontrado' })
  findOne(@Param('id') id: string): Promise<SetorResponseDto> {
    return this.setoresService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_UPDATE)
  @ApiOperation({ summary: 'Atualizar setor' })
  @ApiResponse({ status: 200, type: SetorResponseDto })
  @ApiResponse({ status: 404, description: 'Setor nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSetorDto
  ): Promise<SetorResponseDto> {
    return this.setoresService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.HOSPITAIS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover setor' })
  @ApiResponse({ status: 204, description: 'Setor removido' })
  @ApiResponse({ status: 404, description: 'Setor nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.setoresService.remove(id)
  }
}
