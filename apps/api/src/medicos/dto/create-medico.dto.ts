import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator'
import { IsCPF } from '../../common/validators'

export class CreateMedicoDto {
  @ApiProperty({ example: 'Dr. Jose Silva' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  crm!: string

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  crmUf!: string

  @ApiProperty({ example: 'uuid-especialidade', description: 'ID da especialidade' })
  @IsUUID()
  @IsNotEmpty()
  especialidadeId!: string

  @ApiProperty({ example: '12345678901', required: false, description: 'CPF válido (11 dígitos)' })
  @IsCPF()
  @IsOptional()
  cpf?: string

  @ApiProperty({ example: 'medico@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({ example: '11999999999', required: false })
  @IsString()
  @IsOptional()
  telefone?: string
}
