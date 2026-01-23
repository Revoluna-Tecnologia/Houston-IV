import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class EspecialidadeQueryDto {
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

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  ativo?: boolean

  @ApiProperty({ example: 'Cardio', required: false })
  @IsString()
  @IsOptional()
  search?: string
}
