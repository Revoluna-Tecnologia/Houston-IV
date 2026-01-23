import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ContactResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  ownerId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  phoneNumber!: string

  @ApiPropertyOptional()
  email?: string

  @ApiPropertyOptional()
  avatarUrl?: string

  @ApiPropertyOptional()
  linkedUserId?: string

  @ApiPropertyOptional()
  linkedMedicoId?: string

  @ApiPropertyOptional()
  linkedMedicoName?: string

  @ApiProperty()
  isFavorite!: boolean

  @ApiProperty()
  isBlocked!: boolean

  @ApiPropertyOptional()
  notes?: string

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date
}

export class ContactListResponseDto {
  @ApiProperty({ type: [ContactResponseDto] })
  data!: ContactResponseDto[]

  @ApiProperty()
  total!: number
}
