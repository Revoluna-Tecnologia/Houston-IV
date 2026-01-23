'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const XIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  children: React.ReactNode
  className?: string
}

function BulkActionsBar({
  selectedCount,
  onClear,
  children,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg',
        'animate-in fade-in-0 slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-normal text-gray-700">
          {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0"
        >
          <XIcon />
          <span className="sr-only">Limpar selecao</span>
        </Button>
      </div>
      <div className="h-6 w-px bg-gray-200" />
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export { BulkActionsBar }
