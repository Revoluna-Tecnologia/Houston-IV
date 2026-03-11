import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockMutateAsync = vi.fn()
const mockPreferences = [
  { type: 'ticket_created', inApp: true, email: true, push: false },
]

vi.mock('@/hooks/notifications', () => ({
  useNotificationPreferences: () => ({
    data: mockPreferences,
    isLoading: false,
  }),
  useUpdatePreferences: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader" {...props} />,
  Bell: (props: Record<string, unknown>) => <span data-testid="bell" {...props} />,
  Mail: (props: Record<string, unknown>) => <span data-testid="mail" {...props} />,
  Smartphone: (props: Record<string, unknown>) => <span data-testid="smartphone" {...props} />,
  Save: (props: Record<string, unknown>) => <span data-testid="save" {...props} />,
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled }: {
    checked?: boolean
    onCheckedChange?: (v: boolean) => void
    disabled?: boolean
  }) => (
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
    />
  ),
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}))

vi.mock('@/services/notifications', () => ({
  NOTIFICATION_TYPE_LABELS: {
    ticket_created: 'Ticket Criado',
    ticket_assigned: 'Ticket Atribuido',
    ticket_status_changed: 'Status Alterado',
    ticket_comment_added: 'Comentario Adicionado',
    ticket_sla_warning: 'Alerta SLA',
    ticket_sla_breach: 'Violacao SLA',
    vaga_created: 'Vaga Criada',
    vaga_expiring: 'Vaga Expirando',
    vaga_no_candidates: 'Sem Candidatos',
    candidatura_received: 'Candidatura Recebida',
    candidatura_approved: 'Candidatura Aprovada',
    candidatura_rejected: 'Candidatura Rejeitada',
    message_received: 'Mensagem Recebida',
    conversation_created: 'Conversa Criada',
    shift_offer_received: 'Oferta de Plantao',
    medico_registered: 'Medico Registrado',
    medico_approved: 'Medico Aprovado',
    medico_documents_pending: 'Documentos Pendentes',
    checkin_reminder: 'Lembrete Check-in',
    checkout_reminder: 'Lembrete Check-out',
    checkin_late: 'Check-in Atrasado',
    checkout_late: 'Check-out Atrasado',
    comunicado_published: 'Comunicado Publicado',
  },
}))

// Import after mocks
import { NotificationPreferences } from '../notification-preferences'

describe('NotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders preference categories', () => {
    render(<NotificationPreferences />)
    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText('Mensagens')).toBeInTheDocument()
  })

  it('renders save button', () => {
    render(<NotificationPreferences />)
    expect(screen.getByText('Salvar alterações')).toBeInTheDocument()
  })

  it('save button is disabled when no changes', () => {
    render(<NotificationPreferences />)
    const saveButton = screen.getByText('Salvar alterações').closest('button')
    expect(saveButton).toBeDisabled()
  })

  it('enables save button after toggling a switch', async () => {
    render(<NotificationPreferences />)

    const switches = screen.getAllByTestId('switch')
    await act(async () => {
      switches[0].click()
    })

    const saveButton = screen.getByText('Salvar alterações').closest('button')
    expect(saveButton).not.toBeDisabled()
  })

  it('calls toast.success on successful save', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined)

    render(<NotificationPreferences />)

    // Toggle a switch to enable save
    const switches = screen.getAllByTestId('switch')
    await act(async () => {
      switches[0].click()
    })

    // Click save
    const saveButton = screen.getByText('Salvar alterações').closest('button')!
    await act(async () => {
      saveButton.click()
    })

    expect(mockMutateAsync).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Preferências salvas', {
      description: 'Suas preferências de notificação foram atualizadas.',
    })
  })

  it('calls toast.error on failed save', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))

    render(<NotificationPreferences />)

    // Toggle a switch to enable save
    const switches = screen.getAllByTestId('switch')
    await act(async () => {
      switches[0].click()
    })

    // Click save
    const saveButton = screen.getByText('Salvar alterações').closest('button')!
    await act(async () => {
      saveButton.click()
    })

    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar', {
      description: 'Não foi possível salvar suas preferências.',
    })
  })
})
