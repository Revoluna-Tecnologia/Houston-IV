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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Support')

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder={t('filters.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
          <SelectItem value={TicketStatus.OPEN}>{t('status.open')}</SelectItem>
          <SelectItem value={TicketStatus.IN_REVIEW}>{t('status.inReview')}</SelectItem>
          <SelectItem value={TicketStatus.IN_PROGRESS}>{t('status.inProgress')}</SelectItem>
          <SelectItem value={TicketStatus.RESOLVED}>{t('status.resolved')}</SelectItem>
          <SelectItem value={TicketStatus.CLOSED}>{t('status.closed')}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
          <SelectItem value={TicketPriority.LOW}>{t('priority.low')}</SelectItem>
          <SelectItem value={TicketPriority.MEDIUM}>{t('priority.medium')}</SelectItem>
          <SelectItem value={TicketPriority.HIGH}>{t('priority.high')}</SelectItem>
          <SelectItem value={TicketPriority.CRITICAL}>{t('priority.critical')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
