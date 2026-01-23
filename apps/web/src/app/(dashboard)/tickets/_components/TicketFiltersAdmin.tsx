'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TicketStatus, TicketPriority, TicketCategory } from '@/services/tickets'

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
  { value: 'open', label: 'Aberto' },
  { value: 'in_review', label: 'Em Revisao' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
]

const priorityOptions: { value: TicketPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

const categoryOptions: { value: TicketCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'ui', label: 'UI' },
  { value: 'functionality', label: 'Funcionalidade' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Seguranca' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Outro' },
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
