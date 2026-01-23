import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsString,
  Matches,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator'

export class CreateVagaDto {
  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  data!: string

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaInicio deve estar no formato HH:mm' })
  horaInicio!: string

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaFim deve estar no formato HH:mm' })
  horaFim!: string

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @Min(0)
  valor!: number

  @ApiPropertyOptional({ example: 'Plantao noturno' })
  @IsOptional()
  @IsString()
  observacoes?: string

  @ApiProperty()
  @IsUUID()
  hospitalId!: string

  @ApiProperty()
  @IsUUID()
  setorId!: string

  @ApiProperty()
  @IsUUID()
  especialidadeId!: string
}
