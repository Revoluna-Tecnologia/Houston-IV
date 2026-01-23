import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { CreateGrupoDto } from './create-grupo.dto'

export class UpdateGrupoDto extends PartialType(CreateGrupoDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean
}
