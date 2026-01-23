import { ApiProperty } from '@nestjs/swagger'

export class HospitalResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'Hospital Sao Paulo' })
  nome!: string

  @ApiProperty({ example: '12345678000199', nullable: true })
  cnpj!: string | null

  @ApiProperty({ example: 'Rua das Flores, 123', nullable: true })
  endereco!: string | null

  @ApiProperty({ example: 'Sao Paulo', nullable: true })
  cidade!: string | null

  @ApiProperty({ example: 'SP', nullable: true })
  estado!: string | null

  @ApiProperty({ example: '01234567', nullable: true })
  cep!: string | null

  @ApiProperty({ example: '11999999999', nullable: true })
  telefone!: string | null

  @ApiProperty({ example: 'contato@hospital.com', nullable: true })
  email!: string | null

  @ApiProperty({ example: true })
  ativo!: boolean

  @ApiProperty({ example: 'uuid-grupo-id' })
  grupoId!: string

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
