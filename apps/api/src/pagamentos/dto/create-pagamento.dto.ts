import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class CreatePagamentoDto {
  @ApiProperty({ example: 'uuid-vaga' })
  @IsUUID()
  @IsNotEmpty()
  vagaId!: string

  @ApiProperty({ example: 'uuid-medico' })
  @IsUUID()
  @IsNotEmpty()
  medicoId!: string

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  valor!: number

  @ApiProperty({ example: 'Pagamento referente ao plantao de 25/12', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string
}
