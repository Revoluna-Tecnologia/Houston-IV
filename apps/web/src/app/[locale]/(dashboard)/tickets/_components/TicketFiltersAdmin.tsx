'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Tickets')

  const statusOptions: { value: TicketStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('admin.allStatuses') },
    { value: TicketStatus.OPEN, label: 'Aberto' },
    { value: TicketStatus.IN_REVIEW, label: t('admin.statusInReview') },
    { value: TicketStatus.IN_PROGRESS, label: t('admin.statusInProgress') },
    { value: TicketStatus.RESOLVED, label: t('admin.statusResolved') },
    { value: TicketStatus.CLOSED, label: t('admin.statusClosed') },
  ]

  const priorityOptions: { value: TicketPriority | 'all'; label: string }[] = [
    { value: 'all', label: t('admin.allPriorities') },
    { value: TicketPriority.LOW, label: 'Baixa' },
    { value: TicketPriority.MEDIUM, label: t('admin.priorityMedium') },
    { value: TicketPriority.HIGH, label: 'Alta' },
    { value: TicketPriority.CRITICAL, label: t('admin.priorityCritical') },
  ]

  const categoryOptions: { value: TicketCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('admin.allCategories') },
    { value: TicketCategory.UI, label: 'UI' },
    { value: TicketCategory.FUNCTIONALITY, label: t('admin.categoryFeature') },
    { value: TicketCategory.PERFORMANCE, label: 'Performance' },
    { value: TicketCategory.SECURITY, label: 'Seguranca' },
    { value: TicketCategory.API, label: 'API' },
    { value: TicketCategory.OTHER, label: 'Outro' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <Input
        placeholder={t('admin.searchPlaceholder')}
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
