import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketType,
  TicketSector,
} from '@prisma/client'

export class TicketQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory

  @ApiPropertyOptional({ enum: TicketType })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType

  @ApiPropertyOptional({ enum: TicketSector })
  @IsOptional()
  @IsEnum(TicketSector)
  sector?: TicketSector

  @ApiPropertyOptional({ example: 'uuid-do-grupo' })
  @IsOptional()
  @IsUUID()
  grupoId?: string

  @ApiPropertyOptional({ example: 'uuid-do-criador' })
  @IsOptional()
  @IsUUID()
  createdById?: string

  @ApiPropertyOptional({ example: 'uuid-do-atribuido' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archived?: boolean

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  slaBreach?: boolean

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
