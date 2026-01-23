import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator'
import { KanbanTab } from '@prisma/client'

export class CreateCardDto {
  @ApiProperty({ example: 'Implementar feature X' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @ApiPropertyOptional({ example: 'Descricao detalhada da tarefa' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 'backlog' })
  @IsString()
  @IsNotEmpty()
  status!: string

  @ApiProperty({ enum: KanbanTab, example: 'projetos' })
  @IsEnum(KanbanTab)
  tab!: KanbanTab

  @ApiPropertyOptional({ example: 'uuid-do-responsavel' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string

  @ApiProperty({ example: 'uuid-do-grupo' })
  @IsUUID()
  grupoId!: string
}
