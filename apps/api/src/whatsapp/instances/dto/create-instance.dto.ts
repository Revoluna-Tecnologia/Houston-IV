import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength, MinLength } from 'class-validator'

export class CreateInstanceDto {
  @ApiProperty({ description: 'Nome da instância WhatsApp' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: 'ID do grupo associado' })
  @IsUUID()
  grupoId!: string
}

export class ConnectInstanceDto {
  @ApiPropertyOptional({ description: 'Número de telefone para pairing code (opcional)' })
  @IsString()
  @IsOptional()
  phoneNumber?: string
}

export class UpdateInstanceDto {
  @ApiPropertyOptional({ description: 'Nome da instância' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  name?: string
}
