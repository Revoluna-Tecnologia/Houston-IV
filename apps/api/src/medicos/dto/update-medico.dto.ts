import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { CreateMedicoDto } from './create-medico.dto'

export class UpdateMedicoDto extends PartialType(CreateMedicoDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean
}
