'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationList } from './notification-list'
import { useUnreadCount } from '@/hooks/notifications'
import { cn } from '@/lib/utils'
import type { Notification } from '@/services/notifications'

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void
  className?: string
}

export function NotificationBell({
  onNotificationClick,
  className,
}: NotificationBellProps) {
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} não lida{unreadCount !== 1 && 's'}
            </span>
          )}
        </div>
        <NotificationList
          onNotificationClick={onNotificationClick}
          maxHeight="400px"
        />
      </PopoverContent>
    </Popover>
  )
}
