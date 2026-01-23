import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { IsCNPJ } from '../../common/validators'

export class CreateHospitalDto {
  @ApiProperty({ example: 'Hospital Sao Paulo' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: 'uuid-grupo-id' })
  @IsUUID()
  @IsNotEmpty()
  grupoId!: string

  @ApiProperty({ example: '12345678000199', required: false, description: 'CNPJ válido (14 dígitos)' })
  @IsCNPJ()
  @IsOptional()
  cnpj?: string

  @ApiProperty({ example: 'Rua das Flores, 123', required: false })
  @IsString()
  @IsOptional()
  endereco?: string

  @ApiProperty({ example: 'Sao Paulo', required: false })
  @IsString()
  @IsOptional()
  cidade?: string

  @ApiProperty({ example: 'SP', required: false })
  @IsString()
  @IsOptional()
  estado?: string

  @ApiProperty({ example: '01234567', required: false })
  @IsString()
  @IsOptional()
  cep?: string

  @ApiProperty({ example: '11999999999', required: false })
  @IsString()
  @IsOptional()
  telefone?: string

  @ApiProperty({ example: 'contato@hospital.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string
}
