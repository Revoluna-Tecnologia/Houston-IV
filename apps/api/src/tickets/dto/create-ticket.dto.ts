import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  MaxLength,
  IsUUID,
} from 'class-validator'
import { TicketPriority, TicketCategory, TicketType, TicketSector } from '@prisma/client'

export class CreateTicketDto {
  @ApiProperty({ example: 'Bug no formulário de login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @ApiProperty({ example: 'O botão de login não responde ao clicar' })
  @IsString()
  @IsNotEmpty()
  description!: string

  @ApiProperty({ enum: TicketPriority, example: 'high' })
  @IsEnum(TicketPriority)
  priority!: TicketPriority

  @ApiProperty({ enum: TicketCategory, example: 'functionality' })
  @IsEnum(TicketCategory)
  category!: TicketCategory

  @ApiPropertyOptional({ enum: TicketType, example: 'bug' })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType

  @ApiPropertyOptional({ enum: TicketSector, example: 'dev' })
  @IsOptional()
  @IsEnum(TicketSector)
  sector?: TicketSector

  @ApiPropertyOptional({ example: '/dashboard/login' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string

  @ApiPropertyOptional({ example: '1. Acessar /login\n2. Preencher dados\n3. Clicar em entrar' })
  @IsOptional()
  @IsString()
  reproductionSteps?: string

  @ApiPropertyOptional({ type: [String], example: ['https://storage.com/screenshot1.png'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[]

  @ApiPropertyOptional({ type: [String], example: ['urgent', 'frontend'] })
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
  assignedToId?: string

  @ApiProperty({ example: 'uuid-do-grupo' })
  @IsUUID()
  grupoId!: string
}
