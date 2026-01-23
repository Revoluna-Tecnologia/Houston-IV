'use client';

/**
 * useConversations Hook
 * Gerencia lista de conversas com suporte a WebSocket
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { conversationsService } from '../../services/comunicacao/conversations-service';
import { useWebSocket } from './useWebSocket';
import type {
  Conversation,
  ConversationFilters,
  CreateConversationDto,
  WebSocketMessageNewEvent,
  WebSocketConversationUpdateEvent,
} from '../../services/comunicacao/types';

export interface UseConversationsOptions {
  filters?: ConversationFilters;
  autoFetch?: boolean;
}

export interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  selectedId: string | null;
  select: (id: string | null) => void;
  refetch: () => Promise<void>;
  create: (data: CreateConversationDto) => Promise<Conversation>;
  archive: (id: string, archive: boolean) => Promise<void>;
  delete: (id: string) => Promise<void>;
  isConnected: boolean;
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const { filters, autoFetch = true } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // WebSocket handlers
  const handleMessageNew = useCallback((event: WebSocketMessageNewEvent) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === event.conversationId) {
          return {
            ...conv,
            lastMessageAt: event.message.createdAt,
            lastMessagePreview: event.message.content || `[${event.message.messageType}]`,
            unreadCount: conv.id === selectedId ? 0 : (conv.unreadCount || 0) + 1,
          };
        }
        return conv;
      }).sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      })
    );
  }, [selectedId]);

  const handleConversationUpdate = useCallback((event: WebSocketConversationUpdateEvent) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === event.conversationId) {
          return {
            ...conv,
            ...event,
          };
        }
        return conv;
      })
    );
  }, []);

  const { isConnected } = useWebSocket({
    onMessageNew: handleMessageNew,
    onConversationUpdate: handleConversationUpdate,
  });

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await conversationsService.getAll({
        type: filters?.type,
        isArchived: filters?.isArchived,
        search: filters?.search,
      });
      setConversations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setIsLoading(false);
    }
  }, [filters?.type, filters?.isArchived, filters?.search]);

  useEffect(() => {
    if (autoFetch) {
      fetchConversations();
    }
  }, [autoFetch, fetchConversations]);

  // Actions
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    // Clear unread count when selecting
    if (id) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  }, []);

  const create = useCallback(async (data: CreateConversationDto): Promise<Conversation> => {
    const conversation = await conversationsService.create(data);
    setConversations((prev) => [conversation, ...prev]);
    return conversation;
  }, []);

  const archive = useCallback(async (id: string, shouldArchive: boolean): Promise<void> => {
    await conversationsService.archive(id, shouldArchive);
    if (filters?.isArchived !== undefined && filters.isArchived !== shouldArchive) {
      // Remove from list if filtering
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
    } else {
      // Update in place
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === id ? { ...conv, isArchived: shouldArchive } : conv
        )
      );
    }
  }, [filters?.isArchived]);

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    await conversationsService.delete(id);
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // Filtered and sorted conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (conv) =>
          conv.name?.toLowerCase().includes(searchLower) ||
          conv.lastMessagePreview?.toLowerCase().includes(searchLower) ||
          conv.participants?.some((p) =>
            p.user?.name?.toLowerCase().includes(searchLower) ||
            p.medico?.nome?.toLowerCase().includes(searchLower)
          )
      );
    }

    return result;
  }, [conversations, filters?.search]);

  return {
    conversations: filteredConversations,
    isLoading,
    error,
    selectedId,
    select,
    refetch: fetchConversations,
    create,
    archive,
    delete: deleteConversation,
    isConnected,
  };
}
