import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CheckinCheckoutQueryDto {
  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiProperty({ example: 10, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number

  @ApiProperty({ example: 'createdAt', required: false })
  @IsString()
  @IsOptional()
  sortBy?: string

  @ApiProperty({ example: 'desc', required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc'

  @ApiProperty({ example: 'uuid-vaga-here', required: false })
  @IsUUID()
  @IsOptional()
  vagaId?: string

  @ApiProperty({ example: 'uuid-medico-here', required: false })
  @IsUUID()
  @IsOptional()
  medicoId?: string

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  hasCheckin?: boolean

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  hasCheckout?: boolean

  @ApiProperty({ example: '2024-12-01', required: false })
  @IsDateString()
  @IsOptional()
  dataInicio?: string

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  dataFim?: string
}
