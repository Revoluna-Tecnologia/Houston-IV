import { ApiProperty } from '@nestjs/swagger'

export class PagamentoItemDto {
  @ApiProperty()
  vagaId!: string

  @ApiProperty()
  data!: Date

  @ApiProperty()
  valor!: number

  @ApiProperty()
  status!: string
}

export class FolhaPagamentoResponseDto {
  @ApiProperty()
  medicoId!: string

  @ApiProperty()
  medicoNome!: string

  @ApiProperty()
  totalVagas!: number

  @ApiProperty()
  totalHoras!: number

  @ApiProperty()
  valorTotal!: number

  @ApiProperty({ type: [PagamentoItemDto] })
  pagamentos!: PagamentoItemDto[]
}
