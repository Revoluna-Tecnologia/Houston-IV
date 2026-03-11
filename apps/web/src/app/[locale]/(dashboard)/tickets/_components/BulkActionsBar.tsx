'use client'

import { useTranslations } from 'next-intl'
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

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onArchive,
  onClear,
}: BulkActionsBarProps) {
  const t = useTranslations('Tickets')

  if (selectedCount === 0) return null

  const statusOptions: { value: TicketStatus; label: string }[] = [
    { value: TicketStatus.OPEN, label: 'Aberto' },
    { value: TicketStatus.IN_REVIEW, label: t('admin.statusInReview') },
    { value: TicketStatus.IN_PROGRESS, label: t('admin.statusInProgress') },
    { value: TicketStatus.RESOLVED, label: t('admin.statusResolved') },
    { value: TicketStatus.CLOSED, label: t('admin.statusClosed') },
  ]

  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
      <span className="text-sm font-medium">
        {selectedCount} {t('admin.ticketsSelected')}
      </span>

      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('admin.changeStatus')} />
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
        {t('admin.archive')}
      </Button>

      <Button variant="ghost" size="sm" onClick={onClear}>
        {t('admin.clearSelection')}
      </Button>
    </div>
  )
}
