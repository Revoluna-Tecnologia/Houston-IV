import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class SetorQueryDto {
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

  @ApiProperty({ example: 'uuid-hospital-id', required: false })
  @IsUUID()
  @IsOptional()
  hospitalId?: string

  @ApiProperty({ example: 'UTI', required: false })
  @IsString()
  @IsOptional()
  search?: string
}
