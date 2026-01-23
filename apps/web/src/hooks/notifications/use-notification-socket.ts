'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import type { Notification } from '@/services/notifications'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNT_KEY = ['notifications', 'unread-count']

interface UseNotificationSocketOptions {
  userId?: string
  onNotification?: (notification: Notification) => void
  enabled?: boolean
}

export function useNotificationSocket(options: UseNotificationSocketOptions) {
  const { userId, onNotification, enabled = true } = options
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
      onNotification?.(notification)
    },
    [queryClient, onNotification],
  )

  const handleUnreadCount = useCallback(
    (data: { count: number }) => {
      queryClient.setQueryData(UNREAD_COUNT_KEY, data)
    },
    [queryClient],
  )

  useEffect(() => {
    if (!enabled || !userId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socket = io(`${apiUrl}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('notification:subscribe', { userId })
    })

    socket.on('notification:new', handleNewNotification)
    socket.on('notification:unread_count', handleUnreadCount)

    socket.on('disconnect', () => {
      socket.emit('notification:unsubscribe')
    })

    return () => {
      socket.emit('notification:unsubscribe')
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, enabled, handleNewNotification, handleUnreadCount])

  return {
    isConnected: socketRef.current?.connected ?? false,
  }
}
