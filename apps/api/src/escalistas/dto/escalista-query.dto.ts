import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { EscalistaStatus } from '@prisma/client'

export class EscalistaQueryDto {
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

  @ApiProperty({ enum: ['pendente', 'ativo', 'inativo'], required: false })
  @IsEnum(EscalistaStatus)
  @IsOptional()
  status?: EscalistaStatus

  @ApiProperty({ example: 'uuid-medico', required: false })
  @IsUUID()
  @IsOptional()
  medicoId?: string

  @ApiProperty({ example: 'uuid-grupo', required: false })
  @IsUUID()
  @IsOptional()
  grupoId?: string
}
