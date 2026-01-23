import { ApiProperty } from '@nestjs/swagger'

export class CheckinCheckoutResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'uuid-vaga-here' })
  vagaId!: string

  @ApiProperty({ example: 'uuid-medico-here' })
  medicoId!: string

  @ApiProperty({ example: '2024-12-26T08:00:00.000Z', nullable: true })
  checkinAt!: Date | null

  @ApiProperty({ example: '2024-12-26T18:00:00.000Z', nullable: true })
  checkoutAt!: Date | null

  @ApiProperty({ example: 'Observacoes do registro', nullable: true })
  observacoes!: string | null

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
