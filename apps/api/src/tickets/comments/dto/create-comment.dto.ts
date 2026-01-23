import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'

export class CreateCommentDto {
  @ApiProperty({ example: 'Este bug foi corrigido na versao 2.1.0' })
  @IsString()
  @IsNotEmpty()
  content!: string

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean
}
