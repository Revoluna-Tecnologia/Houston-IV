import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class GradeQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string

  @ApiPropertyOptional({ example: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc'

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  hospitalId?: string

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  setorId?: string

  @ApiPropertyOptional({ example: 'rascunho' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  dataInicio?: string

  @ApiPropertyOptional({ example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  dataFim?: string
}
