import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateEspecialidadeDto {
  @ApiProperty({ example: 'Cardiologia' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: 'CARD', required: false })
  @IsString()
  @IsOptional()
  sigla?: string

  @ApiProperty({ example: '#FF5733', required: false })
  @IsString()
  @IsOptional()
  cor?: string
}
