import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class ContactQueryDto {
  @ApiPropertyOptional({ description: 'Buscar por nome ou telefone' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ description: 'Filtrar apenas favoritos' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  favoritesOnly?: boolean

  @ApiPropertyOptional({ description: 'Filtrar apenas bloqueados' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  blockedOnly?: boolean

  @ApiPropertyOptional({ description: 'Página (default: 1)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({ description: 'Itens por página (default: 50)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 50
}
