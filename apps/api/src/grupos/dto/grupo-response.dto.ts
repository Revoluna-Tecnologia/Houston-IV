import { ApiProperty } from '@nestjs/swagger'

export class GrupoResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'Grupo Hospitalar ABC' })
  nome!: string

  @ApiProperty({ example: 'Grupo de hospitais do ABC paulista', nullable: true })
  descricao!: string | null

  @ApiProperty({ example: true })
  ativo!: boolean

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
