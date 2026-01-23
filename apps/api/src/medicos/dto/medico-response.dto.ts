import { ApiProperty } from '@nestjs/swagger'

export class MedicoResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string

  @ApiProperty({ example: 'Dr. Jose Silva' })
  nome!: string

  @ApiProperty({ example: '123456' })
  crm!: string

  @ApiProperty({ example: 'SP' })
  crmUf!: string

  @ApiProperty({ example: '12345678901', nullable: true })
  cpf!: string | null

  @ApiProperty({ example: 'medico@email.com', nullable: true })
  email!: string | null

  @ApiProperty({ example: '11999999999', nullable: true })
  telefone!: string | null

  @ApiProperty({ example: 'uuid-especialidade' })
  especialidadeId!: string

  @ApiProperty({ example: true })
  ativo!: boolean

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-26T00:00:00.000Z' })
  updatedAt!: Date
}
