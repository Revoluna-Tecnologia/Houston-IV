'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TicketStatus, TicketPriority } from '@/services/tickets'

interface TicketFiltersProps {
  status: string
  priority: string
  search: string
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onSearchChange: (value: string) => void
}

export function TicketFilters({
  status,
  priority,
  search,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Buscar tickets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value={TicketStatus.OPEN}>Aberto</SelectItem>
          <SelectItem value={TicketStatus.IN_REVIEW}>Em Revisao</SelectItem>
          <SelectItem value={TicketStatus.IN_PROGRESS}>Em Andamento</SelectItem>
          <SelectItem value={TicketStatus.RESOLVED}>Resolvido</SelectItem>
          <SelectItem value={TicketStatus.CLOSED}>Fechado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Prioridades</SelectItem>
          <SelectItem value={TicketPriority.LOW}>Baixa</SelectItem>
          <SelectItem value={TicketPriority.MEDIUM}>Media</SelectItem>
          <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
          <SelectItem value={TicketPriority.CRITICAL}>Critica</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
