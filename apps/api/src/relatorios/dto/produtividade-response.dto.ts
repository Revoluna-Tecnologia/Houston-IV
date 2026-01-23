import { ApiProperty } from '@nestjs/swagger'

export class ProdutividadeResponseDto {
  @ApiProperty()
  medicoId!: string

  @ApiProperty()
  medicoNome!: string

  @ApiProperty()
  vagasRealizadas!: number

  @ApiProperty()
  horasTrabalhadas!: number

  @ApiProperty()
  taxaPresenca!: number

  @ApiProperty()
  valorRecebido!: number
}
