import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { CreateEspecialidadeDto } from './create-especialidade.dto'

export class UpdateEspecialidadeDto extends PartialType(CreateEspecialidadeDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean
}
