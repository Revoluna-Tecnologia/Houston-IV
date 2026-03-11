'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Bell, CheckCheck, Loader2, Inbox, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationItem } from '@/components/notifications'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useUnreadCount,
} from '@/hooks/notifications'
import type { Notification, NotificationType } from '@/services/notifications'

export default function NotificationsPage() {
  const t = useTranslations('Notifications')
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useNotifications({
    read: filter === 'unread' ? false : undefined,
    page,
    limit: 20,
  })
  const { data: unreadData } = useUnreadCount()
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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.data) {
      const data = notification.data as Record<string, string>
      if (data.ticketId) {
        router.push(`/tickets/${data.ticketId}`)
      } else if (data.vagaId) {
        router.push(`/vagas/${data.vagaId}`)
      } else if (data.comunicadoId) {
        router.push(`/comunicados/${data.comunicadoId}`)
      }
    }
  }

  const notifications = data?.data ?? []
  const hasUnread = (unreadData?.count ?? 0) > 0

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('unread', { count: unreadData?.count ?? 0 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              {t('markAllRead')}
            </Button>
          )}
          <Link href="/settings/notifications">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs
              value={filter}
              onValueChange={(v) => {
                setFilter(v as 'all' | 'unread')
                setPage(1)
              }}
            >
              <TabsList>
                <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                <TabsTrigger value="unread">{t('tabs.unread')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('loadError')}
              </p>
            </div>
          ) : notifications.length === 0 ? (
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
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('filters.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('filters.pageOf', { page, total: data.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                {t('filters.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
