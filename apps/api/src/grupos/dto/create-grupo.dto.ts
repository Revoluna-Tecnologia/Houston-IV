import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateGrupoDto {
  @ApiProperty({ example: 'Grupo Hospitalar ABC' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: 'Grupo de hospitais do ABC paulista', required: false })
  @IsString()
  @IsOptional()
  descricao?: string
}
