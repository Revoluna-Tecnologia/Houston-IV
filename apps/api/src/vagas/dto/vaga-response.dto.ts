import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { VagaStatus } from '@prisma/client'

export class VagaResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  data!: Date

  @ApiProperty()
  horaInicio!: string

  @ApiProperty()
  horaFim!: string

  @ApiProperty()
  valor!: number

  @ApiPropertyOptional({ nullable: true })
  observacoes!: string | null

  @ApiProperty({ enum: ['aberta', 'fechada', 'cancelada', 'anunciada'] })
  status!: VagaStatus

  @ApiProperty()
  hospitalId!: string

  @ApiProperty()
  setorId!: string

  @ApiProperty()
  especialidadeId!: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date
}
