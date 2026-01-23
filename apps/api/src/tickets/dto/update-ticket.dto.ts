import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  MaxLength,
  IsUUID,
  IsBoolean,
} from 'class-validator'
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketType,
  TicketSector,
} from '@prisma/client'

export class UpdateTicketDto {
  @ApiPropertyOptional({ example: 'Bug no formulário de login - Atualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional({ example: 'Descrição atualizada do problema' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ enum: TicketStatus, example: 'in_progress' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus

  @ApiPropertyOptional({ enum: TicketPriority, example: 'critical' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority

  @ApiPropertyOptional({ enum: TicketCategory, example: 'security' })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory

  @ApiPropertyOptional({ enum: TicketType, example: 'incident' })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType

  @ApiPropertyOptional({ enum: TicketSector, example: 'dev' })
  @IsOptional()
  @IsEnum(TicketSector)
  sector?: TicketSector

  @ApiPropertyOptional({ example: '/dashboard/settings' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string

  @ApiPropertyOptional({ example: 'Passos atualizados para reproduzir' })
  @IsOptional()
  @IsString()
  reproductionSteps?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  slaDeadline?: string

  @ApiPropertyOptional({ example: 'uuid-do-usuario-atribuido' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  archived?: boolean
}
