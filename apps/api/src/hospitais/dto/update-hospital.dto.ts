import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { CreateHospitalDto } from './create-hospital.dto'

export class UpdateHospitalDto extends PartialType(OmitType(CreateHospitalDto, ['grupoId'])) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean
}
