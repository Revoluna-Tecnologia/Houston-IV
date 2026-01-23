import { ApiProperty } from '@nestjs/swagger'

export class EspecialidadeResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'Cardiologia' })
  nome!: string

  @ApiProperty({ example: 'CARD', nullable: true })
  sigla!: string | null

  @ApiProperty({ example: '#FF5733', nullable: true })
  cor!: string | null

  @ApiProperty({ example: true })
  ativo!: boolean

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
