import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsUUID, IsDateString } from 'class-validator'

export class RelatorioFiltrosDto {
  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string

  @ApiPropertyOptional({ example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  dataFim?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hospitalId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  setorId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  medicoId?: string
}
