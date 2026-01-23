import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { NotificationResponseDto } from './dto'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)
  private userSockets: Map<string, Set<string>> = new Map()

  afterInit() {
    this.logger.log('NotificationsGateway initialized')
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.debug(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Client disconnected: ${client.id}`)
    if (client.userId) {
      this.removeUserSocket(client.userId, client.id)
    }
  }

  @SubscribeMessage('notification:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string },
  ) {
    if (!data?.userId) return
    client.userId = data.userId
    this.addUserSocket(data.userId, client.id)
    client.join(`user:${data.userId}`)
    this.logger.debug(`User ${data.userId} subscribed to notifications`)
    return { status: 'subscribed' }
  }

  @SubscribeMessage('notification:unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      client.leave(`user:${client.userId}`)
      this.removeUserSocket(client.userId, client.id)
      this.logger.debug(`User ${client.userId} unsubscribed from notifications`)
    }
    return { status: 'unsubscribed' }
  }

  emitNotification(userId: string, notification: NotificationResponseDto) {
    this.server.to(`user:${userId}`).emit('notification:new', notification)
    this.logger.debug(`Notification sent to user ${userId}: ${notification.type}`)
  }

  emitUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification:unread_count', { count })
  }

  emitBulkNotifications(
    userIds: string[],
    notification: Omit<NotificationResponseDto, 'userId'>,
  ) {
    userIds.forEach((userId) => {
      this.server
        .to(`user:${userId}`)
        .emit('notification:new', { ...notification, userId })
    })
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId)
    return sockets !== undefined && sockets.size > 0
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || new Set()
    sockets.add(socketId)
    this.userSockets.set(userId, sockets)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }
}
