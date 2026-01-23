import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@prisma/client'

export class NotificationResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  userId!: string

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType

  @ApiProperty({ enum: NotificationPriority })
  priority!: NotificationPriority

  @ApiProperty()
  title!: string

  @ApiProperty()
  content!: string

  @ApiPropertyOptional()
  data?: Record<string, unknown>

  @ApiProperty()
  read!: boolean

  @ApiPropertyOptional()
  readAt?: Date

  @ApiProperty()
  sentAt!: Date

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  channels!: NotificationChannel[]

  @ApiPropertyOptional()
  grupoId?: string

  @ApiProperty()
  createdAt!: Date
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count!: number
}

export class NotificationPaginatedResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data!: NotificationResponseDto[]

  @ApiProperty()
  total!: number

  @ApiProperty()
  page!: number

  @ApiProperty()
  limit!: number

  @ApiProperty()
  totalPages!: number
}
