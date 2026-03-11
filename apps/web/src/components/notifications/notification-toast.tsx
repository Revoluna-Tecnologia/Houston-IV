'use client'

import { toast } from 'sonner'
import { useNotificationSocket } from '@/hooks/notifications'
import { useCurrentUser } from '@/hooks/use-current-user'
import type { Notification } from '@/services/notifications'

interface NotificationToastProviderProps {
  children: React.ReactNode
}

export function NotificationToastProvider({
  children,
}: NotificationToastProviderProps) {
  const { user } = useCurrentUser()

  const handleNotification = (notification: Notification) => {
    const toastOptions = {
      description: notification.content,
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    }

    switch (notification.priority) {
      case 'urgent':
        toast.error(notification.title, toastOptions)
        break
      case 'high':
        toast.warning(notification.title, toastOptions)
        break
      default:
        toast.info(notification.title, toastOptions)
        break
    }
  }

  useNotificationSocket({
    userId: user?.id,
    onNotification: handleNotification,
    enabled: !!user?.id,
  })

  return <>{children}</>
}
