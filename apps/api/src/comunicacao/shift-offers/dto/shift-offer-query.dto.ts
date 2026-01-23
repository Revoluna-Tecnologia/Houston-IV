import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsEnum, IsNumber, Min, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { ShiftOfferStatus } from '@prisma/client'

export class ShiftOfferQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por status', enum: ShiftOfferStatus })
  @IsEnum(ShiftOfferStatus)
  @IsOptional()
  status?: ShiftOfferStatus

  @ApiPropertyOptional({ description: 'Filtrar por vaga' })
  @IsUUID()
  @IsOptional()
  vagaId?: string

  @ApiPropertyOptional({ description: 'Filtrar por médico destinatário' })
  @IsUUID()
  @IsOptional()
  recipientMedicoId?: string

  @ApiPropertyOptional({ description: 'Apenas ofertas enviadas por mim' })
  @IsOptional()
  sentByMe?: boolean

  @ApiPropertyOptional({ description: 'Apenas ofertas recebidas por mim' })
  @IsOptional()
  receivedByMe?: boolean

  @ApiPropertyOptional({ description: 'Página (default: 1)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({ description: 'Itens por página (default: 20)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20
}
