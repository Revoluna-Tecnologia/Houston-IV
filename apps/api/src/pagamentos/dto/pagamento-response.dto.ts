import { ApiProperty } from '@nestjs/swagger'
import { PagamentoStatus } from '@prisma/client'

export class PagamentoResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'uuid-vaga' })
  vagaId!: string

  @ApiProperty({ example: 'uuid-medico' })
  medicoId!: string

  @ApiProperty({ example: 1500.00 })
  valor!: number

  @ApiProperty({ enum: PagamentoStatus, example: 'pendente' })
  status!: PagamentoStatus

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z', nullable: true })
  dataAutorizacao!: Date | null

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z', nullable: true })
  dataPagamento!: Date | null

  @ApiProperty({ example: 'Pagamento referente ao plantao', nullable: true })
  observacoes!: string | null

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
