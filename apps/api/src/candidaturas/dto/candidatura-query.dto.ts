import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { CandidaturaStatus } from '@prisma/client'

export class CandidaturaQueryDto {
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

  @ApiProperty({ enum: ['pendente', 'aprovada', 'rejeitada'], required: false })
  @IsOptional()
  @IsEnum(CandidaturaStatus)
  status?: CandidaturaStatus

  @ApiProperty({ example: 'uuid-vaga', required: false })
  @IsOptional()
  @IsUUID()
  vagaId?: string

  @ApiProperty({ example: 'uuid-medico', required: false })
  @IsOptional()
  @IsUUID()
  medicoId?: string
}
