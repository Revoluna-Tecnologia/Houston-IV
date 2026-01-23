import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { NotificationType } from '@prisma/client'

export class UpdatePreferenceDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType

  @ApiPropertyOptional({ description: 'Receber notificações in-app' })
  @IsBoolean()
  @IsOptional()
  inApp?: boolean

  @ApiPropertyOptional({ description: 'Receber notificações por email' })
  @IsBoolean()
  @IsOptional()
  email?: boolean

  @ApiPropertyOptional({ description: 'Receber notificações push' })
  @IsBoolean()
  @IsOptional()
  push?: boolean
}

export class PreferenceResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  userId!: string

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType

  @ApiProperty()
  inApp!: boolean

  @ApiProperty()
  email!: boolean

  @ApiProperty()
  push!: boolean

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date
}

export class BulkUpdatePreferencesDto {
  @ApiProperty({ type: [UpdatePreferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePreferenceDto)
  preferences!: UpdatePreferenceDto[]
}
