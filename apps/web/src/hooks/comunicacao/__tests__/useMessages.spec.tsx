import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessages } from '../useMessages';
import { messagesService } from '../../../services/comunicacao/messages-service';
import type { Message, CursorPaginatedResponse, MessageStatus } from '../../../services/comunicacao/types';

// Mock services
vi.mock('../../../services/comunicacao/messages-service', () => ({
  messagesService: {
    getByConversation: vi.fn(),
    send: vi.fn(),
    markAsRead: vi.fn(),
    delete: vi.fn(),
    react: vi.fn(),
  },
}));

// Mock useWebSocket
const mockJoinConversation = vi.fn();
const mockLeaveConversation = vi.fn();
const mockStartTyping = vi.fn();
const mockStopTyping = vi.fn();

vi.mock('../useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    joinConversation: mockJoinConversation,
    leaveConversation: mockLeaveConversation,
    startTyping: mockStartTyping,
    stopTyping: mockStopTyping,
  }),
}));

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderPhone: '5511999999999',
    content: 'Hello!',
    messageType: 'text',
    status: 'delivered' as MessageStatus,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderPhone: '5511888888888',
    content: 'Hi there!',
    messageType: 'text',
    status: 'delivered' as MessageStatus,
    createdAt: '2024-01-15T10:01:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderPhone: '5511999999999',
    content: 'How are you?',
    messageType: 'text',
    status: 'sent' as MessageStatus,
    createdAt: '2024-01-15T10:02:00Z',
  },
];

const mockResponse: CursorPaginatedResponse<Message> = {
  data: mockMessages,
  meta: {
    hasMore: false,
    nextCursor: undefined,
    limit: 50,
  },
};

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messagesService.getByConversation).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('returns empty state when conversationId is null', () => {
      const { result } = renderHook(() => useMessages({ conversationId: null }));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('fetches messages when conversationId is provided', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(messagesService.getByConversation).toHaveBeenCalledWith('conv-1', {
        cursor: undefined,
        limit: 50,
      });
      expect(result.current.messages).toHaveLength(3);
    });
  });

  describe('WebSocket room management', () => {
    it('joins conversation room when mounted', async () => {
      renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(mockJoinConversation).toHaveBeenCalledWith('conv-1');
      });
    });

    it('leaves conversation room when unmounted', async () => {
      const { unmount } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(mockJoinConversation).toHaveBeenCalled();
      });

      unmount();

      expect(mockLeaveConversation).toHaveBeenCalledWith('conv-1');
    });

    it('switches rooms when conversationId changes', async () => {
      const { rerender } = renderHook(
        ({ conversationId }) => useMessages({ conversationId }),
        { initialProps: { conversationId: 'conv-1' } }
      );

      await waitFor(() => {
        expect(mockJoinConversation).toHaveBeenCalledWith('conv-1');
      });

      rerender({ conversationId: 'conv-2' });

      await waitFor(() => {
        expect(mockLeaveConversation).toHaveBeenCalledWith('conv-1');
        expect(mockJoinConversation).toHaveBeenCalledWith('conv-2');
      });
    });
  });

  describe('fetching messages', () => {
    it('fetches messages successfully', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Messages are reversed (newest last)
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(messagesService.getByConversation).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.messages).toEqual([]);
    });

    it('sets hasMore from response meta', async () => {
      vi.mocked(messagesService.getByConversation).mockResolvedValueOnce({
        data: mockMessages,
        meta: {
          hasMore: true,
          nextCursor: 'cursor-123',
          limit: 50,
        },
      });

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('loadMore', () => {
    it('loads more messages when hasMore is true', async () => {
      vi.mocked(messagesService.getByConversation)
        .mockResolvedValueOnce({
          data: mockMessages.slice(1),
          meta: { hasMore: true, nextCursor: 'cursor-1', limit: 50 },
        })
        .mockResolvedValueOnce({
          data: [mockMessages[0]],
          meta: { hasMore: false, nextCursor: undefined, limit: 50 },
        });

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toHaveLength(2);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(messagesService.getByConversation).toHaveBeenCalledTimes(2);
      expect(messagesService.getByConversation).toHaveBeenLastCalledWith('conv-1', {
        cursor: 'cursor-1',
        limit: 50,
      });
      expect(result.current.messages).toHaveLength(3);
    });

    it('does not load more when hasMore is false', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
      expect(messagesService.getByConversation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(messagesService.getByConversation).toHaveBeenCalledTimes(1);
    });
  });

  describe('send', () => {
    it('sends message with optimistic update', async () => {
      const sentMessage: Message = {
        id: 'msg-4',
        conversationId: 'conv-1',
        senderPhone: '5511999999999',
        content: 'New message',
        messageType: 'text',
        status: 'sent' as MessageStatus,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(messagesService.send).mockResolvedValueOnce(sentMessage);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.send('New message');
      });

      expect(messagesService.send).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        content: 'New message',
        messageType: 'text',
        metadata: undefined,
      });

      // Message should be in the list
      expect(result.current.messages.find((m) => m.id === 'msg-4')).toBeDefined();
    });

    it('throws error on send failure', async () => {
      vi.mocked(messagesService.send).mockRejectedValueOnce(new Error('Send failed'));

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send should throw the error
      let thrownError: Error | undefined;
      try {
        await act(async () => {
          await result.current.send('Failed message');
        });
      } catch (err) {
        thrownError = err as Error;
      }

      expect(thrownError?.message).toBe('Send failed');
      // After error, isSending should be false
      expect(result.current.isSending).toBe(false);
    });

    it('does nothing when conversationId is null', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: null }));

      await act(async () => {
        await result.current.send('Test');
      });

      expect(messagesService.send).not.toHaveBeenCalled();
    });
  });

  describe('reply', () => {
    it('sends reply message', async () => {
      const replyMessage: Message = {
        id: 'msg-5',
        conversationId: 'conv-1',
        senderPhone: '5511999999999',
        content: 'Reply content',
        messageType: 'text',
        status: 'sent' as MessageStatus,
        replyTo: mockMessages[0],
        createdAt: new Date().toISOString(),
      };

      vi.mocked(messagesService.send).mockResolvedValueOnce(replyMessage);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.reply('Reply content', 'msg-1');
      });

      expect(messagesService.send).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        content: 'Reply content',
        messageType: 'text',
        replyToId: 'msg-1',
      });
    });
  });

  describe('markAsRead', () => {
    it('marks conversation messages as read', async () => {
      vi.mocked(messagesService.markAsRead).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead();
      });

      expect(messagesService.markAsRead).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('deleteMessage', () => {
    it('deletes message and updates state', async () => {
      vi.mocked(messagesService.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(messagesService.delete).toHaveBeenCalledWith('msg-1');
      // Message should have deletedAt set
      const deletedMsg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(deletedMsg?.deletedAt).toBeDefined();
    });
  });

  describe('react', () => {
    it('reacts to message', async () => {
      vi.mocked(messagesService.react).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.react('msg-1', '');
      });

      expect(messagesService.react).toHaveBeenCalledWith('msg-1', '');
    });
  });

  describe('typing', () => {
    it('calls startTyping on websocket', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // startTyping should call websocket startTyping
      result.current.startTyping();

      expect(mockStartTyping).toHaveBeenCalledWith('conv-1');
    });

    it('calls stopTyping on websocket', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.stopTyping();

      expect(mockStopTyping).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('refetch', () => {
    it('refetches messages', async () => {
      const { result } = renderHook(() => useMessages({ conversationId: 'conv-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(messagesService.getByConversation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(messagesService.getByConversation).toHaveBeenCalledTimes(2);
    });
  });
});
