import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator'

export class CreateShiftOfferDto {
  @ApiProperty({ description: 'ID da vaga a ser oferecida' })
  @IsUUID()
  vagaId!: string

  @ApiProperty({ description: 'ID da conversa para enviar a oferta' })
  @IsUUID()
  conversationId!: string

  @ApiPropertyOptional({ description: 'ID do médico destinatário' })
  @IsUUID()
  @IsOptional()
  recipientMedicoId?: string

  @ApiPropertyOptional({ description: 'Telefone do destinatário (se não for médico)' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{10,14}$/, { message: 'Telefone inválido' })
  recipientPhone?: string

  @ApiPropertyOptional({ description: 'Mensagem personalizada' })
  @IsString()
  @IsOptional()
  customMessage?: string

  @ApiPropertyOptional({ description: 'Data de expiração da oferta' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string
}

export class RespondShiftOfferDto {
  @ApiProperty({ description: 'Aceitar ou rejeitar', enum: ['accept', 'reject'] })
  @IsString()
  @IsNotEmpty()
  action!: 'accept' | 'reject'

  @ApiPropertyOptional({ description: 'Motivo da rejeição' })
  @IsString()
  @IsOptional()
  reason?: string
}
