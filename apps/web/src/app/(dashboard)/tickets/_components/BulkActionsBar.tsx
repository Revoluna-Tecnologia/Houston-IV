'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TicketStatus } from '@/services/tickets'

interface BulkActionsBarProps {
  selectedCount: number
  onStatusChange: (status: TicketStatus) => void
  onArchive: () => void
  onClear: () => void
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: TicketStatus.OPEN, label: 'Aberto' },
  { value: TicketStatus.IN_REVIEW, label: 'Em Revisao' },
  { value: TicketStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: TicketStatus.RESOLVED, label: 'Resolvido' },
  { value: TicketStatus.CLOSED, label: 'Fechado' },
]

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onArchive,
  onClear,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
      <span className="text-sm font-medium">
        {selectedCount} ticket(s) selecionado(s)
      </span>

      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Alterar status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={onArchive}>
        Arquivar
      </Button>

      <Button variant="ghost" size="sm" onClick={onClear}>
        Limpar selecao
      </Button>
    </div>
  )
}
