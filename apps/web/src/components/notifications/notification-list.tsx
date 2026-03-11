'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem } from './notification-item'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/notifications'
import type { Notification } from '@/services/notifications'

interface NotificationListProps {
  onNotificationClick?: (notification: Notification) => void
  maxHeight?: string
}

export function NotificationList({
  onNotificationClick,
  maxHeight = '400px',
}: NotificationListProps) {
  const t = useTranslations('Notifications')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data, isLoading, error } = useNotifications({
    read: filter === 'unread' ? false : undefined,
    limit: 50,
  })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {t('loadError')}
        </p>
      </div>
    )
  }

  const notifications = data?.data ?? []
  const hasUnread = notifications.some((n) => !n.read)

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unread')}
        >
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">
              {t('tabs.all')}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-3">
              {t('tabs.unread')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      <ScrollArea style={{ maxHeight }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {filter === 'unread'
                ? t('empty.unread')
                : t('empty.all')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {data && data.totalPages > 1 && (
        <div className="px-4 py-3 border-t text-center">
          <Button variant="link" size="sm" className="text-xs">
            {t('viewAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
