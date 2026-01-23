import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConversations } from '../useConversations';
import { conversationsService } from '../../../services/comunicacao/conversations-service';
import { ConversationType } from '../../../services/comunicacao/types';
import type { Conversation, PaginatedResponse } from '../../../services/comunicacao/types';

// Mock services
vi.mock('../../../services/comunicacao/conversations-service', () => ({
  conversationsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useWebSocket
vi.mock('../useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
  }),
}));

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: ConversationType.DIRECT,
    name: 'John Doe',
    createdById: 'user-1',
    grupoId: 'grupo-1',
    isArchived: false,
    unreadCount: 2,
    lastMessageAt: '2024-01-15T10:00:00Z',
    lastMessagePreview: 'Hello there!',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'conv-2',
    type: ConversationType.GROUP,
    name: 'Team Chat',
    createdById: 'user-1',
    grupoId: 'grupo-1',
    isArchived: false,
    unreadCount: 0,
    lastMessageAt: '2024-01-14T15:00:00Z',
    lastMessagePreview: 'Meeting at 3pm',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T15:00:00Z',
  },
];

const mockResponse: PaginatedResponse<Conversation> = {
  data: mockConversations,
  meta: {
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(conversationsService.getAll).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useConversations());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.conversations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('fetches conversations on mount when autoFetch is true', async () => {
      const { result } = renderHook(() => useConversations({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(conversationsService.getAll).toHaveBeenCalledTimes(1);
      expect(result.current.conversations).toHaveLength(2);
    });

    it('does not fetch conversations when autoFetch is false', () => {
      renderHook(() => useConversations({ autoFetch: false }));

      expect(conversationsService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('fetching conversations', () => {
    it('fetches conversations successfully', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toEqual(mockConversations);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(conversationsService.getAll).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.conversations).toEqual([]);
    });

    it('passes filters to service', async () => {
      const filters = { type: ConversationType.DIRECT, isArchived: false };

      const { result } = renderHook(() => useConversations({ filters }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(conversationsService.getAll).toHaveBeenCalledWith({
        type: ConversationType.DIRECT,
        isArchived: false,
        search: undefined,
      });
    });
  });

  describe('refetch', () => {
    it('refetches conversations', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(conversationsService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(conversationsService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('select', () => {
    it('selects conversation by id', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.select('conv-1');
      });

      expect(result.current.selectedId).toBe('conv-1');
    });

    it('clears selection when null is passed', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.select('conv-1');
      });

      expect(result.current.selectedId).toBe('conv-1');

      act(() => {
        result.current.select(null);
      });

      expect(result.current.selectedId).toBeNull();
    });

    it('clears unread count when selecting conversation', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations[0].unreadCount).toBe(2);

      act(() => {
        result.current.select('conv-1');
      });

      expect(result.current.conversations.find((c) => c.id === 'conv-1')?.unreadCount).toBe(0);
    });
  });

  describe('create', () => {
    it('creates new conversation and adds to list', async () => {
      const newConversation: Conversation = {
        id: 'conv-3',
        type: ConversationType.DIRECT,
        name: 'New Contact',
        createdById: 'user-1',
        grupoId: 'grupo-1',
        isArchived: false,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(conversationsService.create).mockResolvedValueOnce(newConversation);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: Conversation | undefined;
      await act(async () => {
        created = await result.current.create({
          type: ConversationType.DIRECT,
          participantPhones: ['5511999999999'],
        });
      });

      expect(created).toEqual(newConversation);
      expect(result.current.conversations).toContainEqual(newConversation);
    });
  });

  describe('archive', () => {
    it('archives conversation and updates state', async () => {
      vi.mocked(conversationsService.archive).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.archive('conv-1', true);
      });

      expect(conversationsService.archive).toHaveBeenCalledWith('conv-1', true);
      expect(result.current.conversations.find((c) => c.id === 'conv-1')?.isArchived).toBe(true);
    });

    it('removes conversation from list when filtering by archive status', async () => {
      vi.mocked(conversationsService.archive).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useConversations({ filters: { isArchived: false } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(2);

      await act(async () => {
        await result.current.archive('conv-1', true);
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations.find((c) => c.id === 'conv-1')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes conversation and removes from list', async () => {
      vi.mocked(conversationsService.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(2);

      await act(async () => {
        await result.current.delete('conv-1');
      });

      expect(conversationsService.delete).toHaveBeenCalledWith('conv-1');
      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations.find((c) => c.id === 'conv-1')).toBeUndefined();
    });

    it('clears selection when deleting selected conversation', async () => {
      vi.mocked(conversationsService.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.select('conv-1');
      });

      expect(result.current.selectedId).toBe('conv-1');

      await act(async () => {
        await result.current.delete('conv-1');
      });

      expect(result.current.selectedId).toBeNull();
    });
  });

  describe('local search filter', () => {
    it('filters conversations by name', async () => {
      const { result } = renderHook(() =>
        useConversations({ filters: { search: 'john' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].name).toBe('John Doe');
    });

    it('filters conversations by last message preview', async () => {
      const { result } = renderHook(() =>
        useConversations({ filters: { search: 'meeting' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].lastMessagePreview).toContain('Meeting');
    });
  });

  describe('isConnected', () => {
    it('returns WebSocket connection status', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
    });
  });
});
