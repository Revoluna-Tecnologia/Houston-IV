export enum KanbanTab {
  PROJETOS = 'projetos',
  FINANCEIRO = 'financeiro',
}

export enum KanbanTimelineType {
  CREATE = 'create',
  MOVE = 'move',
  COMMENT = 'comment',
  ASSIGN = 'assign',
  TAG = 'tag',
  LINK = 'link',
  UPDATE = 'update',
}

export interface KanbanTag {
  id: string
  name: string
  color: string
}

export interface KanbanLink {
  id: string
  title: string
  url: string
}

export interface KanbanTimelineEntry {
  id: string
  type: KanbanTimelineType
  authorId: string
  content: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface KanbanCard {
  id: string
  title: string
  description: string | null
  status: string
  tab: KanbanTab
  assigneeId: string | null
  grupoId: string
  createdById: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  tags?: KanbanTag[]
  links?: KanbanLink[]
  timeline?: KanbanTimelineEntry[]
}

export interface CreateCardDto {
  title: string
  description?: string
  status: string
  tab: KanbanTab
  assigneeId?: string
  grupoId: string
}

export interface UpdateCardDto {
  title?: string
  description?: string
  status?: string
  assigneeId?: string
}

export interface MoveCardDto {
  status: string
}

export interface KanbanQueryParams {
  tab?: KanbanTab
  status?: string
  grupoId?: string
  assigneeId?: string
  search?: string
  includeDeleted?: boolean
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanBoard {
  columns: KanbanColumn[]
  tags: KanbanTag[]
}
