import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { CreateGradeDto } from './create-grade.dto'

export enum GradeStatus {
  RASCUNHO = 'rascunho',
  PUBLICADA = 'publicada',
  ENCERRADA = 'encerrada',
}

export class UpdateGradeDto extends PartialType(CreateGradeDto) {
  @ApiPropertyOptional({ enum: GradeStatus, example: GradeStatus.PUBLICADA })
  @IsEnum(GradeStatus)
  @IsOptional()
  status?: GradeStatus
}
