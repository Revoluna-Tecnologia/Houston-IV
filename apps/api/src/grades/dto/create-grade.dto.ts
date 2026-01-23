import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateGradeDto {
  @ApiProperty({ example: 'Grade Janeiro 2025' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiPropertyOptional({ example: 'Grade de plantoes de janeiro' })
  @IsString()
  @IsOptional()
  descricao?: string

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  dataInicio!: string

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  dataFim!: string

  @ApiProperty()
  @IsUUID()
  hospitalId!: string

  @ApiProperty()
  @IsUUID()
  setorId!: string
}
