import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'
import { MessageType } from '../../types'

export class MessageQueryDto {
  @ApiPropertyOptional({
    enum: MessageType,
    description: 'Filtrar por tipo de mensagem',
  })
  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType

  @ApiPropertyOptional({
    description: 'Data inicial (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({
    description: 'Data final (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({
    description: 'Buscar no conteúdo da mensagem',
    example: 'plantão',
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
    example: 50,
    default: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 50

  @ApiPropertyOptional({
    description: 'ID da última mensagem carregada (para paginação infinita)',
  })
  @IsString()
  @IsOptional()
  cursor?: string
}
