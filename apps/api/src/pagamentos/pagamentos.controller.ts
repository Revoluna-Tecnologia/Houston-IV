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
import { PagamentosService } from './pagamentos.service'
import {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  PagamentoQueryDto,
  PagamentoResponseDto,
  BulkPagamentoDto,
} from './dto'
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@ApiTags('Pagamentos')
@ApiBearerAuth()
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  @Post()
  @RequirePermissions(AppPermission.PAGAMENTOS_INSERT)
  @ApiOperation({ summary: 'Criar pagamento' })
  @ApiResponse({ status: 201, type: PagamentoResponseDto })
  @ApiResponse({ status: 409, description: 'Pagamento ja existe' })
  create(@Body() dto: CreatePagamentoDto): Promise<PagamentoResponseDto> {
    return this.pagamentosService.create(dto)
  }

  @Get()
  @RequirePermissions(AppPermission.PAGAMENTOS_SELECT)
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: PagamentoQueryDto) {
    return this.pagamentosService.findAll(query)
  }

  @Get(':id')
  @RequirePermissions(AppPermission.PAGAMENTOS_SELECT)
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiResponse({ status: 200, type: PagamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado' })
  findOne(@Param('id') id: string): Promise<PagamentoResponseDto> {
    return this.pagamentosService.findOne(id)
  }

  @Put(':id')
  @RequirePermissions(AppPermission.PAGAMENTOS_UPDATE)
  @ApiOperation({ summary: 'Atualizar pagamento' })
  @ApiResponse({ status: 200, type: PagamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePagamentoDto
  ): Promise<PagamentoResponseDto> {
    return this.pagamentosService.update(id, dto)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.PAGAMENTOS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover pagamento' })
  @ApiResponse({ status: 204, description: 'Pagamento removido' })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.pagamentosService.remove(id)
  }

  @Patch(':id/autorizar')
  @RequirePermissions(AppPermission.PAGAMENTOS_UPDATE)
  @ApiOperation({ summary: 'Autorizar pagamento' })
  @ApiResponse({ status: 200, type: PagamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Transicao de status invalida' })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado' })
  autorizar(@Param('id') id: string): Promise<PagamentoResponseDto> {
    return this.pagamentosService.autorizar(id)
  }

  @Patch(':id/pagar')
  @RequirePermissions(AppPermission.PAGAMENTOS_UPDATE)
  @ApiOperation({ summary: 'Marcar pagamento como pago' })
  @ApiResponse({ status: 200, type: PagamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Transicao de status invalida' })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado' })
  pagar(@Param('id') id: string): Promise<PagamentoResponseDto> {
    return this.pagamentosService.pagar(id)
  }

  @Post('bulk/autorizar')
  @RequirePermissions(AppPermission.PAGAMENTOS_UPDATE)
  @ApiOperation({ summary: 'Autorizar multiplos pagamentos' })
  @ApiResponse({ status: 200, description: 'Resultado da operacao em lote' })
  bulkAutorizar(@Body() dto: BulkPagamentoDto) {
    return this.pagamentosService.bulkAutorizar(dto.ids)
  }

  @Post('bulk/pagar')
  @RequirePermissions(AppPermission.PAGAMENTOS_UPDATE)
  @ApiOperation({ summary: 'Marcar multiplos pagamentos como pagos' })
  @ApiResponse({ status: 200, description: 'Resultado da operacao em lote' })
  bulkPagar(@Body() dto: BulkPagamentoDto) {
    return this.pagamentosService.bulkPagar(dto.ids)
  }
}
