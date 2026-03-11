'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Bell, Mail, Smartphone, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from '@/hooks/notifications'
import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
  type NotificationPreference,
  type UpdatePreferenceInput,
} from '@/services/notifications'

const NOTIFICATION_CATEGORIES: {
  title: string
  description: string
  types: NotificationType[]
}[] = [
  {
    title: 'Tickets',
    description: 'Notificações sobre tickets e atendimentos',
    types: [
      'ticket_created',
      'ticket_assigned',
      'ticket_status_changed',
      'ticket_comment_added',
      'ticket_sla_warning',
      'ticket_sla_breach',
    ],
  },
  {
    title: 'Vagas e Candidaturas',
    description: 'Notificações sobre vagas e processos seletivos',
    types: [
      'vaga_created',
      'vaga_expiring',
      'vaga_no_candidates',
      'candidatura_received',
      'candidatura_approved',
      'candidatura_rejected',
    ],
  },
  {
    title: 'Mensagens',
    description: 'Notificações de comunicação',
    types: ['message_received', 'conversation_created', 'shift_offer_received'],
  },
  {
    title: 'Médicos',
    description: 'Notificações sobre cadastro de médicos',
    types: ['medico_registered', 'medico_approved', 'medico_documents_pending'],
  },
  {
    title: 'Check-in/Check-out',
    description: 'Lembretes e alertas de presença',
    types: ['checkin_reminder', 'checkout_reminder', 'checkin_late', 'checkout_late'],
  },
  {
    title: 'Comunicados',
    description: 'Comunicados e avisos gerais',
    types: ['comunicado_published'],
  },
]

interface PreferenceState {
  [type: string]: {
    inApp: boolean
    email: boolean
    push: boolean
  }
}

export function NotificationPreferences() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updatePreferences = useUpdatePreferences()
  const [localPreferences, setLocalPreferences] = useState<PreferenceState>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (preferences) {
      const state: PreferenceState = {}
      for (const pref of preferences) {
        state[pref.type] = {
          inApp: pref.inApp,
          email: pref.email,
          push: pref.push,
        }
      }
      setLocalPreferences(state)
      setHasChanges(false)
    }
  }, [preferences])

  const getPreference = (type: NotificationType, channel: 'inApp' | 'email' | 'push') => {
    return localPreferences[type]?.[channel] ?? (channel === 'push' ? false : true)
  }

  const setPreference = (
    type: NotificationType,
    channel: 'inApp' | 'email' | 'push',
    value: boolean,
  ) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [type]: {
        inApp: prev[type]?.inApp ?? true,
        email: prev[type]?.email ?? true,
        push: prev[type]?.push ?? false,
        [channel]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    const updates: UpdatePreferenceInput[] = Object.entries(localPreferences).map(
      ([type, prefs]) => ({
        type: type as NotificationType,
        inApp: prefs.inApp,
        email: prefs.email,
        push: prefs.push,
      }),
    )

    try {
      await updatePreferences.mutateAsync(updates)
      toast.success('Preferências salvas', {
        description: 'Suas preferências de notificação foram atualizadas.',
      })
      setHasChanges(false)
    } catch {
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar suas preferências.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Preferências de Notificação</h2>
          <p className="text-sm text-muted-foreground">
            Configure como deseja receber suas notificações
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePreferences.isPending}
        >
          {updatePreferences.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar alterações
        </Button>
      </div>

      <div className="grid gap-6">
        {NOTIFICATION_CATEGORIES.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="text-base">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div>Tipo</div>
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" /> In-App
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </div>
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> Push
                  </div>
                </div>

                {category.types.map((type) => (
                  <div key={type} className="grid grid-cols-4 gap-4 items-center">
                    <Label className="text-sm">
                      {NOTIFICATION_TYPE_LABELS[type] || type}
                    </Label>
                    <div>
                      <Switch
                        checked={getPreference(type, 'inApp')}
                        onCheckedChange={(v) => setPreference(type, 'inApp', v)}
                      />
                    </div>
                    <div>
                      <Switch
                        checked={getPreference(type, 'email')}
                        onCheckedChange={(v) => setPreference(type, 'email', v)}
                      />
                    </div>
                    <div>
                      <Switch
                        checked={getPreference(type, 'push')}
                        onCheckedChange={(v) => setPreference(type, 'push', v)}
                        disabled
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>* Notificações push estarão disponíveis em breve.</p>
      </div>
    </div>
  )
}
