import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator'

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'Nome da conversa/grupo',
    example: 'Plantão UTI - Fevereiro',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Se a conversa está arquivada',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean
}
