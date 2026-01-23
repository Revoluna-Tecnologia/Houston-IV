import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class CreateCandidaturaDto {
  @ApiProperty({ example: 'uuid-vaga' })
  @IsUUID()
  vagaId!: string

  @ApiProperty({ example: 'uuid-medico' })
  @IsUUID()
  medicoId!: string
}
