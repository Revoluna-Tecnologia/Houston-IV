'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useNotificationSocket } from '@/hooks/notifications'
import { useCurrentUser } from '@/hooks/use-current-user'
import type { Notification } from '@/services/notifications'

interface NotificationToastProviderProps {
  children: React.ReactNode
}

export function NotificationToastProvider({
  children,
}: NotificationToastProviderProps) {
  const { toast } = useToast()
  const { user } = useCurrentUser()

  const handleNotification = (notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.content,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      variant: notification.priority === 'urgent' ? 'destructive' : 'default',
    })
  }

  useNotificationSocket({
    userId: user?.id,
    onNotification: handleNotification,
    enabled: !!user?.id,
  })

  return <>{children}</>
}
