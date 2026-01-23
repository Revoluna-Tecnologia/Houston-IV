import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsDateString } from 'class-validator'

export class AnalyticsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grupoId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string
}
