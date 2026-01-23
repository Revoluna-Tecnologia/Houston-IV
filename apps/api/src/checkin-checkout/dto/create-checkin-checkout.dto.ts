import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateCheckinCheckoutDto {
  @ApiProperty({ example: 'uuid-vaga-here' })
  @IsUUID()
  @IsNotEmpty()
  vagaId!: string

  @ApiProperty({ example: 'uuid-medico-here' })
  @IsUUID()
  @IsNotEmpty()
  medicoId!: string

  @ApiProperty({ example: 'Observacoes opcionais', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string
}
