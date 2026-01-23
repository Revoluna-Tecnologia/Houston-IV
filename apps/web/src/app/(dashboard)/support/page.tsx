'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTickets } from '@/hooks/tickets'
import { TicketCard, CreateTicketModal, TicketFilters } from './_components'
import type { Ticket, TicketQueryParams, CreateTicketDto, TicketStatus, TicketPriority } from '@/services/tickets'

const TEMP_GRUPO_ID = 'grupo-temp'

export default function SupportPage() {
  const router = useRouter()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  })

  const queryParams: TicketQueryParams = useMemo(() => {
    const params: TicketQueryParams = { grupoId: TEMP_GRUPO_ID }
    if (filters.status !== 'all') params.status = filters.status as TicketStatus
    if (filters.priority !== 'all') params.priority = filters.priority as TicketPriority
    if (filters.search) params.search = filters.search
    return params
  }, [filters])

  const { data: tickets, isLoading, error, create } = useTickets(queryParams)

  const handleViewTicket = useCallback((ticket: Ticket) => {
    router.push(`/support/${ticket.id}`)
  }, [router])

  const handleCreateTicket = useCallback(async (data: CreateTicketDto) => {
    await create(data)
  }, [create])

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erro ao carregar tickets: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Suporte</h1>
          <p className="text-muted-foreground">Abra e acompanhe seus tickets de suporte</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Ticket
        </Button>
      </div>

      <TicketFilters
        status={filters.status}
        priority={filters.priority}
        search={filters.search}
        onStatusChange={(status) => setFilters({ ...filters, status })}
        onPriorityChange={(priority) => setFilters({ ...filters, priority })}
        onSearchChange={(search) => setFilters({ ...filters, search })}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Nenhum ticket encontrado</h3>
          <p className="text-muted-foreground mt-1">Crie um novo ticket para obter ajuda</p>
          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
            Criar Ticket
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onView={handleViewTicket} />
          ))}
        </div>
      )}

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateTicket}
        grupoId={TEMP_GRUPO_ID}
      />
    </div>
  )
}
