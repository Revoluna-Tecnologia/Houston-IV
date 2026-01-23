import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'
import { NotificationType } from '@prisma/client'

export class NotificationQueryDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType

  @ApiPropertyOptional({ description: 'Filtrar por lidas/não lidas' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  read?: boolean

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20
}
