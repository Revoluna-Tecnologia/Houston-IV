import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { RelatoriosService } from './relatorios.service'
import {
  RelatorioFiltrosDto,
  FolhaPagamentoResponseDto,
  GradesResponseDto,
  ProdutividadeResponseDto,
  FiltrosDisponiveisResponseDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Relatorios')
@ApiBearerAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('folha-pagamento')
  @RequirePermissions(AppPermission.RELATORIOS_SELECT)
  @ApiOperation({ summary: 'Relatorio de folha de pagamento' })
  @ApiResponse({ status: 200, type: [FolhaPagamentoResponseDto] })
  getFolhaPagamento(@Query() filtros: RelatorioFiltrosDto): Promise<FolhaPagamentoResponseDto[]> {
    return this.relatoriosService.getFolhaPagamento(filtros)
  }

  @Get('grades')
  @RequirePermissions(AppPermission.RELATORIOS_SELECT)
  @ApiOperation({ summary: 'Relatorio de grades' })
  @ApiResponse({ status: 200, type: [GradesResponseDto] })
  getGrades(@Query() filtros: RelatorioFiltrosDto): Promise<GradesResponseDto[]> {
    return this.relatoriosService.getGrades(filtros)
  }

  @Get('produtividade')
  @RequirePermissions(AppPermission.RELATORIOS_SELECT)
  @ApiOperation({ summary: 'Relatorio de produtividade' })
  @ApiResponse({ status: 200, type: [ProdutividadeResponseDto] })
  getProdutividade(@Query() filtros: RelatorioFiltrosDto): Promise<ProdutividadeResponseDto[]> {
    return this.relatoriosService.getProdutividade(filtros)
  }

  @Get('filtros')
  @RequirePermissions(AppPermission.RELATORIOS_SELECT)
  @ApiOperation({ summary: 'Opcoes de filtros disponiveis' })
  @ApiResponse({ status: 200, type: FiltrosDisponiveisResponseDto })
  getFiltrosDisponiveis(): Promise<FiltrosDisponiveisResponseDto> {
    return this.relatoriosService.getFiltrosDisponiveis()
  }
}
