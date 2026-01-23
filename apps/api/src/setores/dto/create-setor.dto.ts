import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateSetorDto {
  @ApiProperty({ example: 'UTI' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: 'Unidade de Terapia Intensiva', required: false })
  @IsString()
  @IsOptional()
  descricao?: string

  @ApiProperty({ example: 'uuid-hospital-id' })
  @IsUUID()
  @IsNotEmpty()
  hospitalId!: string
}
