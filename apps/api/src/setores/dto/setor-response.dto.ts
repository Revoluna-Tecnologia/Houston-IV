import { ApiProperty } from '@nestjs/swagger'

export class SetorResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'UTI' })
  nome!: string

  @ApiProperty({ example: 'Unidade de Terapia Intensiva', nullable: true })
  descricao!: string | null

  @ApiProperty({ example: true })
  ativo!: boolean

  @ApiProperty({ example: 'uuid-hospital-id' })
  hospitalId!: string

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
