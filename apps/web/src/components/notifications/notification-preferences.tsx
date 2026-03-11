'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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

interface PreferenceState {
  [type: string]: {
    inApp: boolean
    email: boolean
    push: boolean
  }
}

export function NotificationPreferences() {
  const t = useTranslations('Notifications')
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updatePreferences = useUpdatePreferences()
  const [localPreferences, setLocalPreferences] = useState<PreferenceState>({})
  const [hasChanges, setHasChanges] = useState(false)

  const NOTIFICATION_CATEGORIES: {
    title: string
    description: string
    types: NotificationType[]
  }[] = [
    {
      title: t('preferences.categories.tickets'),
      description: t('preferences.categories.ticketsDesc'),
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
      title: t('preferences.categories.vagasCandidaturas'),
      description: t('preferences.categories.vagasCandidaturasDesc'),
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
      title: t('preferences.categories.messages'),
      description: t('preferences.categories.messagesDesc'),
      types: ['message_received', 'conversation_created', 'shift_offer_received'],
    },
    {
      title: t('preferences.categories.medicos'),
      description: t('preferences.categories.medicosDesc'),
      types: ['medico_registered', 'medico_approved', 'medico_documents_pending'],
    },
    {
      title: t('preferences.categories.checkinCheckout'),
      description: t('preferences.categories.checkinCheckoutDesc'),
      types: ['checkin_reminder', 'checkout_reminder', 'checkin_late', 'checkout_late'],
    },
    {
      title: t('preferences.categories.comunicados'),
      description: t('preferences.categories.comunicadosDesc'),
      types: ['comunicado_published'],
    },
  ]

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
      toast.success(t('preferences.savedTitle'), {
        description: t('preferences.savedDescription'),
      })
      setHasChanges(false)
    } catch {
      toast.error(t('preferences.errorTitle'), {
        description: t('preferences.errorDescription'),
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
          <h2 className="text-lg font-semibold">{t('preferences.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('preferences.description')}
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
          {t('preferences.save')}
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
                  <div>{t('preferences.type')}</div>
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" /> {t('preferences.inApp')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {t('preferences.email')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> {t('preferences.push')}
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
        <p>{t('preferences.pushComingSoon')}</p>
      </div>
    </div>
  )
}
