import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TimeSlotResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  data!: Date

  @ApiProperty({ example: '08:00' })
  horaInicio!: string

  @ApiProperty({ example: '12:00' })
  horaFim!: string

  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  medicoId!: string | null

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  updatedAt!: Date
}

export class GradeResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'Grade Janeiro 2025' })
  nome!: string

  @ApiPropertyOptional({ example: 'Grade de plantoes de janeiro', nullable: true })
  descricao!: string | null

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  dataInicio!: Date

  @ApiProperty({ example: '2025-01-31T00:00:00.000Z' })
  dataFim!: Date

  @ApiProperty({ example: 'uuid-here' })
  hospitalId!: string

  @ApiProperty({ example: 'uuid-here' })
  setorId!: string

  @ApiProperty({ example: 'rascunho' })
  status!: string

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  updatedAt!: Date

  @ApiPropertyOptional({ type: [TimeSlotResponseDto] })
  timeSlots?: TimeSlotResponseDto[]
}
