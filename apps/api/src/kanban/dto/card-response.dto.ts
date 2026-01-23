import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { KanbanTab } from '@prisma/client'

export class KanbanTagDto {
  @ApiProperty({ example: 'uuid-da-tag' })
  id!: string

  @ApiProperty({ example: 'Frontend' })
  name!: string

  @ApiProperty({ example: '#3B82F6' })
  color!: string
}

export class KanbanLinkDto {
  @ApiProperty({ example: 'uuid-do-link' })
  id!: string

  @ApiProperty({ example: 'Design no Figma' })
  title!: string

  @ApiProperty({ example: 'https://figma.com/file/xxx' })
  url!: string
}

export class KanbanTimelineDto {
  @ApiProperty({ example: 'uuid-do-evento' })
  id!: string

  @ApiProperty({ example: 'move' })
  type!: string

  @ApiProperty({ example: 'uuid-do-autor' })
  authorId!: string

  @ApiPropertyOptional({ example: 'Movido de backlog para in_progress' })
  content!: string | null

  @ApiPropertyOptional()
  metadata!: Record<string, unknown> | null

  @ApiProperty({ example: '2024-12-20T10:00:00Z' })
  createdAt!: Date
}

export class CardResponseDto {
  @ApiProperty({ example: 'uuid-do-card' })
  id!: string

  @ApiProperty({ example: 'Implementar feature X' })
  title!: string

  @ApiPropertyOptional({ example: 'Descricao detalhada' })
  description!: string | null

  @ApiProperty({ example: 'in_progress' })
  status!: string

  @ApiProperty({ enum: KanbanTab, example: 'projetos' })
  tab!: KanbanTab

  @ApiPropertyOptional({ example: 'uuid-do-responsavel' })
  assigneeId!: string | null

  @ApiProperty({ example: 'uuid-do-grupo' })
  grupoId!: string

  @ApiProperty({ example: 'uuid-do-criador' })
  createdById!: string

  @ApiProperty({ example: '2024-12-20T10:00:00Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-20T15:30:00Z' })
  updatedAt!: Date

  @ApiPropertyOptional({ example: null })
  deletedAt!: Date | null

  @ApiPropertyOptional({ type: [KanbanTagDto] })
  tags?: KanbanTagDto[]

  @ApiPropertyOptional({ type: [KanbanLinkDto] })
  links?: KanbanLinkDto[]

  @ApiPropertyOptional({ type: [KanbanTimelineDto] })
  timeline?: KanbanTimelineDto[]
}
