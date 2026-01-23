import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator'
import { KanbanTab } from '@prisma/client'

export class UpdateCardDto {
  @ApiPropertyOptional({ example: 'Implementar feature X - Atualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional({ example: 'Descricao atualizada' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ example: 'in_progress' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ enum: KanbanTab, example: 'projetos' })
  @IsOptional()
  @IsEnum(KanbanTab)
  tab?: KanbanTab

  @ApiPropertyOptional({ example: 'uuid-do-responsavel' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null
}
