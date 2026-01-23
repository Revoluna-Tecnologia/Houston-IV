export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CursorPaginationParams {
  cursor?: string
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  meta: CursorPaginationMeta
}

export interface CursorPaginationMeta {
  nextCursor: string | null
  previousCursor: string | null
  hasMore: boolean
  total?: number
}
