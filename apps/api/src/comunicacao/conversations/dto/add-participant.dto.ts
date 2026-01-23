import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  Matches,
} from 'class-validator'
import { ParticipantRole } from '../../types'

export class AddParticipantDto {
  @ApiProperty({
    description: 'Número de telefone do participante',
    example: '+5511999998888',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{10,14}$/, {
    message: 'Telefone inválido. Use formato: +5511999998888',
  })
  phoneNumber!: string

  @ApiPropertyOptional({
    description: 'ID do médico a vincular (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  medicoId?: string

  @ApiPropertyOptional({
    enum: ParticipantRole,
    description: 'Role do participante no grupo',
    default: 'member',
  })
  @IsEnum(ParticipantRole)
  @IsOptional()
  role?: ParticipantRole = ParticipantRole.member
}
