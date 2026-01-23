import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsBoolean,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateContactDto {
  @ApiProperty({ description: 'Nome do contato' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: 'Número de telefone' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{10,14}$/, { message: 'Telefone inválido' })
  phoneNumber!: string

  @ApiPropertyOptional({ description: 'Email do contato' })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsString()
  @IsOptional()
  avatarUrl?: string

  @ApiPropertyOptional({ description: 'ID do usuário vinculado' })
  @IsUUID()
  @IsOptional()
  linkedUserId?: string

  @ApiPropertyOptional({ description: 'ID do médico vinculado' })
  @IsUUID()
  @IsOptional()
  linkedMedicoId?: string

  @ApiPropertyOptional({ description: 'Marcar como favorito' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean

  @ApiPropertyOptional({ description: 'Notas sobre o contato' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string
}

export class UpdateContactDto {
  @ApiPropertyOptional({ description: 'Nome do contato' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ description: 'Email do contato' })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsString()
  @IsOptional()
  avatarUrl?: string

  @ApiPropertyOptional({ description: 'ID do médico vinculado' })
  @IsUUID()
  @IsOptional()
  linkedMedicoId?: string

  @ApiPropertyOptional({ description: 'Marcar como favorito' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean

  @ApiPropertyOptional({ description: 'Marcar como bloqueado' })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean

  @ApiPropertyOptional({ description: 'Notas sobre o contato' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string
}
