import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class CreateEscalistaDto {
  @ApiProperty({ example: 'uuid-medico' })
  @IsUUID()
  medicoId!: string

  @ApiProperty({ example: 'uuid-grupo' })
  @IsUUID()
  grupoId!: string
}
