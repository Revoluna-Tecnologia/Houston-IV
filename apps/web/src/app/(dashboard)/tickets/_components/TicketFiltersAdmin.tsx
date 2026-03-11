'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TicketStatus, TicketPriority, TicketCategory } from '@/services/tickets'

interface TicketFiltersAdminProps {
  search: string
  status: TicketStatus | 'all'
  priority: TicketPriority | 'all'
  category: TicketCategory | 'all'
  onSearchChange: (value: string) => void
  onStatusChange: (value: TicketStatus | 'all') => void
  onPriorityChange: (value: TicketPriority | 'all') => void
  onCategoryChange: (value: TicketCategory | 'all') => void
}

const statusOptions: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: TicketStatus.OPEN, label: 'Aberto' },
  { value: TicketStatus.IN_REVIEW, label: 'Em Revisao' },
  { value: TicketStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: TicketStatus.RESOLVED, label: 'Resolvido' },
  { value: TicketStatus.CLOSED, label: 'Fechado' },
]

const priorityOptions: { value: TicketPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as prioridades' },
  { value: TicketPriority.LOW, label: 'Baixa' },
  { value: TicketPriority.MEDIUM, label: 'Media' },
  { value: TicketPriority.HIGH, label: 'Alta' },
  { value: TicketPriority.CRITICAL, label: 'Critica' },
]

const categoryOptions: { value: TicketCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: TicketCategory.UI, label: 'UI' },
  { value: TicketCategory.FUNCTIONALITY, label: 'Funcionalidade' },
  { value: TicketCategory.PERFORMANCE, label: 'Performance' },
  { value: TicketCategory.SECURITY, label: 'Seguranca' },
  { value: TicketCategory.API, label: 'API' },
  { value: TicketCategory.OTHER, label: 'Outro' },
]

export function TicketFiltersAdmin({
  search,
  status,
  priority,
  category,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}: TicketFiltersAdminProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <Input
        placeholder="Buscar tickets..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
