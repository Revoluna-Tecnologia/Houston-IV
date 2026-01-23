import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { CandidaturaStatus } from '@prisma/client'

export class UpdateCandidaturaDto {
  @ApiProperty({ enum: ['pendente', 'aprovada', 'rejeitada'] })
  @IsEnum(CandidaturaStatus)
  status!: CandidaturaStatus
}
