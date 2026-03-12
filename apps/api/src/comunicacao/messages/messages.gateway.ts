import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ChatMessage, MessageStatus } from "../../generated/prisma/client";
import {
  TypingEvent,
  NewMessageEvent,
  MessageStatusEvent,
  MessageDeletedEvent,
  ConversationUpdateEvent,
} from "../types";

/**
 * WebSocket Gateway para Mensagens em Tempo Real
 * Responsabilidade única: Comunicação bidirecional em tempo real
 */
@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  // Mapa de userId -> Set de socketIds
  private userSockets: Map<string, Set<string>> = new Map();

  // Mapa de socketId -> userId
  private socketUsers: Map<string, string> = new Map();

  afterInit(): void {
    this.logger.log("WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extrair userId do handshake (auth ou query)
      const userId =
        (client.handshake.auth?.userId as string) ||
        (client.handshake.query?.userId as string);

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected without userId`);
        client.disconnect();
        return;
      }

      // Armazenar conexão
      client.data.userId = userId;
      this.socketUsers.set(client.id, userId);

      const userSockets = this.userSockets.get(userId) || new Set();
      userSockets.add(client.id);
      this.userSockets.set(userId, userSockets);

      this.logger.log(
        `Client connected: ${client.id} (user: ${userId}, total connections: ${userSockets.size})`,
      );
    } catch (error) {
      this.logger.error("Connection error", error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketUsers.get(client.id);

    if (userId) {
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Cliente entra em uma sala de conversa
   */
  @SubscribeMessage("join:conversation")
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    const userId = client.data.userId;
    if (!userId) return;

    client.join(`conversation:${conversationId}`);
    this.logger.debug(`User ${userId} joined conversation ${conversationId}`);
  }

  /**
   * Cliente sai de uma sala de conversa
   */
  @SubscribeMessage("leave:conversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    client.leave(`conversation:${conversationId}`);
  }

  /**
   * Cliente começa a digitar
   */
  @SubscribeMessage("typing:start")
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userName?: string },
  ): void {
    const userId = client.data.userId;
    if (!userId) return;

    const event: TypingEvent = {
      conversationId: data.conversationId,
      userId,
      userName: data.userName || "Usuário",
      isTyping: true,
    };

    // Emitir para todos na conversa exceto o remetente
    client
      .to(`conversation:${data.conversationId}`)
      .emit("typing:update", event);
  }

  /**
   * Cliente para de digitar
   */
  @SubscribeMessage("typing:stop")
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    const userId = client.data.userId;
    if (!userId) return;

    const event: TypingEvent = {
      conversationId,
      userId,
      userName: "",
      isTyping: false,
    };

    client.to(`conversation:${conversationId}`).emit("typing:update", event);
  }

  /**
   * Cliente marca conversa como lida
   */
  @SubscribeMessage("messages:read")
  handleMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): void {
    const userId = client.data.userId;
    if (!userId) return;

    // Emitir evento de leitura para outros participantes
    client.to(`conversation:${conversationId}`).emit("messages:read", {
      conversationId,
      userId,
      timestamp: new Date(),
    });
  }

  // ====================================
  // Métodos para emitir eventos do servidor
  // ====================================

  /**
   * Emite nova mensagem para todos na conversa
   */
  emitNewMessage(conversationId: string, message: ChatMessage): void {
    const event: NewMessageEvent = {
      conversationId,
      message: {
        id: message.id,
        content: message.content || undefined,
        messageType: message.messageType,
        senderId: message.senderId || undefined,
        senderPhone: message.senderPhone,
        createdAt: message.createdAt,
        metadata: message.metadata as Record<string, unknown> | undefined,
      },
    };

    this.server.to(`conversation:${conversationId}`).emit("message:new", event);
    this.logger.debug(`Emitted new message to conversation ${conversationId}`);
  }

  /**
   * Emite atualização de status de mensagem
   */
  emitMessageStatusUpdate(
    conversationId: string,
    messageId: string,
    status: MessageStatus,
  ): void {
    const event: MessageStatusEvent = {
      conversationId,
      messageId,
      status,
      timestamp: new Date(),
    };

    this.server
      .to(`conversation:${conversationId}`)
      .emit("message:status", event);
  }

  /**
   * Emite mensagem deletada
   */
  emitMessageDeleted(conversationId: string, messageId: string): void {
    const event: MessageDeletedEvent = {
      conversationId,
      messageId,
    };

    this.server
      .to(`conversation:${conversationId}`)
      .emit("message:deleted", event);
  }

  /**
   * Emite atualização de conversa
   */
  emitConversationUpdate(
    conversationId: string,
    update: Partial<ConversationUpdateEvent>,
  ): void {
    this.server
      .to(`conversation:${conversationId}`)
      .emit("conversation:update", {
        conversationId,
        ...update,
      });
  }

  /**
   * Emite evento para um usuário específico
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Verifica se um usuário está online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Retorna IDs de usuários online
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
