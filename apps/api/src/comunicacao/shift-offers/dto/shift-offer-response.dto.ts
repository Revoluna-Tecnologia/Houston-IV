import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ShiftOfferStatus } from '@prisma/client'

export class VagaInfoDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  data!: Date

  @ApiPropertyOptional()
  horaInicio?: string

  @ApiPropertyOptional()
  horaFim?: string

  @ApiPropertyOptional()
  valor?: number

  @ApiPropertyOptional()
  hospitalNome?: string

  @ApiPropertyOptional()
  setorNome?: string

  @ApiPropertyOptional()
  especialidadeNome?: string
}

export class ShiftOfferResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  vagaId!: string

  @ApiProperty({ type: VagaInfoDto })
  vaga!: VagaInfoDto

  @ApiPropertyOptional()
  messageId?: string

  @ApiProperty()
  senderId!: string

  @ApiPropertyOptional()
  senderName?: string

  @ApiPropertyOptional()
  recipientId?: string

  @ApiPropertyOptional()
  recipientMedicoId?: string

  @ApiPropertyOptional()
  recipientMedicoName?: string

  @ApiProperty()
  recipientPhone!: string

  @ApiProperty({ enum: ShiftOfferStatus })
  status!: ShiftOfferStatus

  @ApiProperty()
  expiresAt!: Date

  @ApiProperty()
  createdAt!: Date

  @ApiPropertyOptional()
  respondedAt?: Date

  @ApiProperty()
  isExpired!: boolean

  @ApiProperty()
  canRespond!: boolean
}

export class ShiftOfferListResponseDto {
  @ApiProperty({ type: [ShiftOfferResponseDto] })
  data!: ShiftOfferResponseDto[]

  @ApiProperty()
  total!: number
}
