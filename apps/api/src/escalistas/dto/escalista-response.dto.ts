import { ApiProperty } from '@nestjs/swagger'
import { EscalistaStatus } from '@prisma/client'

export class EscalistaResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'uuid-medico' })
  medicoId!: string

  @ApiProperty({ example: 'uuid-grupo' })
  grupoId!: string

  @ApiProperty({ enum: ['pendente', 'ativo', 'inativo'] })
  status!: EscalistaStatus

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
