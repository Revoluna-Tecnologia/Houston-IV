import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsString,
  Matches,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator'
import { VagaStatus } from '@prisma/client'

export class UpdateVagaDto {
  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  data?: string

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaInicio deve estar no formato HH:mm' })
  horaInicio?: string

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaFim deve estar no formato HH:mm' })
  horaFim?: string

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number

  @ApiPropertyOptional({ example: 'Plantao noturno' })
  @IsOptional()
  @IsString()
  observacoes?: string

  @ApiPropertyOptional({ enum: ['aberta', 'fechada', 'cancelada', 'anunciada'] })
  @IsOptional()
  @IsEnum(VagaStatus)
  status?: VagaStatus
}
