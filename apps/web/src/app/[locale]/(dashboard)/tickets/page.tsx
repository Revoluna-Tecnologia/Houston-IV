'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTickets } from '@/hooks/tickets'
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/services/tickets'
import {
  TicketsTable,
  TicketDetailsModal,
  BulkActionsBar,
  TicketFiltersAdmin,
} from './_components'

export default function TicketsManagementPage() {
  const t = useTranslations('Tickets')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const queryParams = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: search || undefined,
  }), [statusFilter, priorityFilter, categoryFilter, search])

  const {
    data: tickets,
    total,
    isLoading,
    error,
    updateStatus,
    archive,
    refetch,
  } = useTickets(queryParams)

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    )
  }, [])

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      setSelectedIds(selected ? tickets.map((t) => t.id) : [])
    },
    [tickets]
  )

  const handleBulkStatusChange = useCallback(
    async (status: TicketStatus) => {
      await Promise.all(selectedIds.map((id) => updateStatus(id, status)))
      setSelectedIds([])
      refetch()
    },
    [selectedIds, updateStatus, refetch]
  )

  const handleBulkArchive = useCallback(async () => {
    if (!confirm(t('archiveConfirm', { count: selectedIds.length }))) return
    await Promise.all(selectedIds.map((id) => archive(id)))
    setSelectedIds([])
    refetch()
  }, [selectedIds, archive, refetch, t])

  const handleStatusChange = useCallback(
    async (id: string, status: TicketStatus) => {
      await updateStatus(id, status)
      refetch()
    },
    [updateStatus, refetch]
  )

  const handleAssign = useCallback(async (id: string, assigneeId: string | null) => {
  }, [])

  const handleArchive = useCallback(
    async (id: string) => {
      await archive(id)
      refetch()
    },
    [archive, refetch]
  )

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length
    const inProgress = tickets.filter((t) => ['in_review', 'in_progress'].includes(t.status)).length
    const resolved = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length
    const slaBreach = tickets.filter((t) => t.slaBreach).length
    return { open, inProgress, resolved, slaBreach }
  }, [tickets])

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{t('loadError')}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <span className="text-muted-foreground">{t('count', { count: total })}</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('status.open')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('status.inProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('status.resolved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{t('status.slaViolated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.slaBreach}</div>
          </CardContent>
        </Card>
      </div>

      <TicketFiltersAdmin
        search={search}
        status={statusFilter}
        priority={priorityFilter}
        category={categoryFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
      />

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onStatusChange={handleBulkStatusChange}
        onArchive={handleBulkArchive}
        onClear={() => setSelectedIds([])}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <TicketsTable
              tickets={tickets}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={setSelectedTicket}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      )}

      <TicketDetailsModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
        onArchive={handleArchive}
      />
    </div>
  )
}
