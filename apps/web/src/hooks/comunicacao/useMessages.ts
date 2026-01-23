'use client';

/**
 * useMessages Hook
 * Gerencia mensagens de uma conversa com suporte a WebSocket e optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesService } from '../../services/comunicacao/messages-service';
import { useWebSocket } from './useWebSocket';
import type {
  Message,
  SendMessageDto,
  MessageType,
  MessageStatus,
  OptimisticMessage,
  WebSocketMessageNewEvent,
  WebSocketMessageStatusEvent,
  WebSocketTypingEvent,
  TypingState,
} from '../../services/comunicacao/types';

export interface UseMessagesOptions {
  conversationId: string | null;
  limit?: number;
}

export interface UseMessagesReturn {
  messages: (Message | OptimisticMessage)[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  error: Error | null;
  typingUsers: TypingState;
  loadMore: () => Promise<void>;
  send: (content: string, type?: MessageType, metadata?: Record<string, unknown>) => Promise<void>;
  reply: (content: string, replyToId: string, type?: MessageType) => Promise<void>;
  markAsRead: () => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  react: (id: string, emoji: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  refetch: () => Promise<void>;
}

let localIdCounter = 0;
function generateLocalId(): string {
  return `local_${Date.now()}_${++localIdCounter}`;
}

export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const { conversationId, limit = 50 } = options;

  const [messages, setMessages] = useState<(Message | OptimisticMessage)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const cursorRef = useRef<string | undefined>(undefined);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket handlers
  const handleMessageNew = useCallback((event: WebSocketMessageNewEvent) => {
    if (event.conversationId === conversationId) {
      setMessages((prev) => {
        // Check if message already exists (optimistic update)
        const existingIndex = prev.findIndex(
          (m) => 'isOptimistic' in m && m.whatsappMessageId === event.message.whatsappMessageId
        );

        if (existingIndex !== -1) {
          // Replace optimistic message with real one
          const newMessages = [...prev];
          newMessages[existingIndex] = event.message;
          return newMessages;
        }

        // Add new message
        return [...prev, event.message];
      });
    }
  }, [conversationId]);

  const handleMessageStatus = useCallback((event: WebSocketMessageStatusEvent) => {
    if (event.conversationId === conversationId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === event.messageId ? { ...msg, status: event.status } : msg
        )
      );
    }
  }, [conversationId]);

  const handleTyping = useCallback((event: WebSocketTypingEvent) => {
    if (event.conversationId === conversationId) {
      setTypingUsers((prev) => {
        const users = prev[conversationId] || [];

        if (event.isTyping) {
          // Add typing user
          const exists = users.some((u) => u.userId === event.userId);
          if (!exists) {
            return {
              ...prev,
              [conversationId]: [
                ...users,
                {
                  userId: event.userId,
                  userName: event.userName,
                  timestamp: Date.now(),
                },
              ],
            };
          }
        } else {
          // Remove typing user
          return {
            ...prev,
            [conversationId]: users.filter((u) => u.userId !== event.userId),
          };
        }
        return prev;
      });
    }
  }, [conversationId]);

  const { joinConversation, leaveConversation, startTyping: wsStartTyping, stopTyping: wsStopTyping } = useWebSocket({
    onMessageNew: handleMessageNew,
    onMessageStatus: handleMessageStatus,
    onTyping: handleTyping,
  });

  // Join/leave conversation room
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      return () => {
        leaveConversation(conversationId);
      };
    }
    return undefined;
  }, [conversationId, joinConversation, leaveConversation]);

  // Fetch messages
  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await messagesService.getByConversation(conversationId, {
        cursor: loadMore ? cursorRef.current : undefined,
        limit,
      });

      if (loadMore) {
        setMessages((prev) => [...response.data.reverse(), ...prev]);
      } else {
        setMessages(response.data.reverse());
      }

      cursorRef.current = response.meta.nextCursor;
      setHasMore(response.meta.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, limit]);

  useEffect(() => {
    if (conversationId) {
      cursorRef.current = undefined;
      setMessages([]);
      setHasMore(true);
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Actions
  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchMessages(true);
    }
  }, [isLoading, hasMore, fetchMessages]);

  const send = useCallback(async (
    content: string,
    type: MessageType = 'text' as MessageType,
    metadata?: Record<string, unknown>
  ) => {
    if (!conversationId) return;

    const localId = generateLocalId();
    const optimisticMessage: OptimisticMessage = {
      id: localId,
      localId,
      conversationId,
      senderPhone: '',
      content,
      messageType: type,
      status: 'sending' as MessageStatus,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      metadata: metadata as Message['metadata'],
    };

    // Add optimistic message
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      const dto: SendMessageDto = {
        conversationId,
        content,
        messageType: type,
        metadata: metadata as SendMessageDto['metadata'],
      };
      const sentMessage = await messagesService.send(dto);

      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((msg) =>
          'localId' in msg && msg.localId === localId ? sentMessage : msg
        )
      );
    } catch (err) {
      // Mark as failed
      setMessages((prev) =>
        prev.map((msg) =>
          'localId' in msg && msg.localId === localId
            ? { ...msg, status: 'failed' as MessageStatus }
            : msg
        )
      );
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [conversationId]);

  const reply = useCallback(async (
    content: string,
    replyToId: string,
    type: MessageType = 'text' as MessageType
  ) => {
    if (!conversationId) return;

    setIsSending(true);
    try {
      const dto: SendMessageDto = {
        conversationId,
        content,
        messageType: type,
        replyToId,
      };
      const sentMessage = await messagesService.send(dto);
      setMessages((prev) => [...prev, sentMessage]);
    } finally {
      setIsSending(false);
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (conversationId) {
      await messagesService.markAsRead(conversationId);
    }
  }, [conversationId]);

  const deleteMessage = useCallback(async (id: string) => {
    await messagesService.delete(id);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, deletedAt: new Date().toISOString() } : msg
      )
    );
  }, []);

  const react = useCallback(async (id: string, emoji: string) => {
    await messagesService.react(id, emoji);
  }, []);

  const startTyping = useCallback(() => {
    if (conversationId) {
      wsStartTyping(conversationId);

      // Auto-stop after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        wsStopTyping(conversationId);
      }, 3000);
    }
  }, [conversationId, wsStartTyping, wsStopTyping]);

  const stopTyping = useCallback(() => {
    if (conversationId) {
      wsStopTyping(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [conversationId, wsStopTyping]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    hasMore,
    error,
    typingUsers,
    loadMore,
    send,
    reply,
    markAsRead,
    deleteMessage,
    react,
    startTyping,
    stopTyping,
    refetch: fetchMessages,
  };
}
