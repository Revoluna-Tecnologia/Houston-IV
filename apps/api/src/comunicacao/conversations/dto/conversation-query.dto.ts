import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ConversationType } from '../../types'

export class ConversationQueryDto {
  @ApiPropertyOptional({
    enum: ConversationType,
    description: 'Filtrar por tipo de conversa',
  })
  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType

  @ApiPropertyOptional({
    description: 'Filtrar por arquivadas (true/false)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isArchived?: boolean

  @ApiPropertyOptional({
    description: 'Buscar por nome ou telefone de participante',
    example: 'João',
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20
}
