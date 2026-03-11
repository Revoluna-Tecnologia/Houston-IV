'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const ChevronUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronsUpDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
)

export type SortDirection = 'asc' | 'desc' | null

export interface ColumnDef<T> {
  id: string
  header: string | (() => React.ReactNode)
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface SortingState {
  id: string
  direction: SortDirection
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
  totalCount: number
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  sorting?: SortingState | null
  onSort?: (sorting: SortingState | null) => void
  pagination?: PaginationState
  onPageChange?: (pageIndex: number) => void
  className?: string
  emptyMessage?: string
}

function DataTable<T>({
  columns,
  data,
  sorting,
  onSort,
  pagination,
  onPageChange,
  className,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations('Common')

  const handleSort = (columnId: string) => {
    if (!onSort) return

    if (sorting?.id !== columnId) {
      onSort({ id: columnId, direction: 'asc' })
    } else if (sorting.direction === 'asc') {
      onSort({ id: columnId, direction: 'desc' })
    } else {
      onSort(null)
    }
  }

  const totalPages = pagination
    ? Math.ceil(pagination.totalCount / pagination.pageSize)
    : 0

  const getCellValue = (row: T, column: ColumnDef<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessorKey) {
      return (row as Record<string, unknown>)[column.accessorKey as string] as React.ReactNode
    }
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.sortable && 'cursor-pointer select-none',
                  column.className
                )}
                onClick={column.sortable ? () => handleSort(column.id) : undefined}
              >
                <div className="flex items-center gap-1">
                  {typeof column.header === 'function' ? column.header() : column.header}
                  {column.sortable && (
                    <span className="ml-1">
                      {sorting?.id === column.id ? (
                        sorting.direction === 'asc' ? (
                          <ChevronUpIcon />
                        ) : (
                          <ChevronDownIcon />
                        )
                      ) : (
                        <ChevronsUpDownIcon />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage ?? t('dataTable.noResults')}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {getCellValue(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-700">
            {t('dataTable.showing', {
              from: pagination.pageIndex * pagination.pageSize + 1,
              to: Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                pagination.totalCount
              ),
              total: pagination.totalCount,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              {t('dataTable.previous')}
            </Button>
            <span className="text-sm text-gray-700">
              {t('dataTable.pageOf', { page: pagination.pageIndex + 1, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= totalPages - 1}
            >
              {t('dataTable.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }
