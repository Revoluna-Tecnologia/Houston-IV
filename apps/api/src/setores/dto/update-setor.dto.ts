import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { CreateSetorDto } from './create-setor.dto'

export class UpdateSetorDto extends PartialType(OmitType(CreateSetorDto, ['hospitalId'])) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean
}
