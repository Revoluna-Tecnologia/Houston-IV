import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server';
import { messagesService } from '../messages-service';
import { MessageType, MessageStatus } from '../types';
import { mockMessages } from './mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('MessagesService', () => {
  describe('getByConversation', () => {
    it('fetches messages for conversation successfully', async () => {
      const response = await messagesService.getByConversation('conv-1');

      expect(response.data).toHaveLength(mockMessages.length);
      expect(response.meta).toHaveProperty('hasMore');
    });

    it('fetches messages with cursor pagination', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/messages/conversation/:conversationId`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockMessages.slice(1),
            meta: { nextCursor: undefined, hasMore: false },
          });
        })
      );

      await messagesService.getByConversation('conv-1', { cursor: 'msg-1' });

      expect(capturedUrl).toContain('cursor=msg-1');
    });

    it('fetches messages with custom limit', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/messages/conversation/:conversationId`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockMessages.slice(0, 10),
            meta: { nextCursor: undefined, hasMore: false },
          });
        })
      );

      await messagesService.getByConversation('conv-1', { limit: 10 });

      expect(capturedUrl).toContain('limit=10');
    });

    it('handles empty messages', async () => {
      server.use(
        http.get(`${API_BASE_URL}/messages/conversation/:conversationId`, () => {
          return HttpResponse.json({
            data: [],
            meta: { hasMore: false },
          });
        })
      );

      const response = await messagesService.getByConversation('conv-1');

      expect(response.data).toHaveLength(0);
      expect(response.meta.hasMore).toBe(false);
    });
  });

  describe('send', () => {
    it('sends text message successfully', async () => {
      const messageData = {
        conversationId: 'conv-1',
        content: 'Olá, teste!',
        messageType: MessageType.TEXT,
      };

      const message = await messagesService.send(messageData);

      expect(message).toHaveProperty('id');
      expect(message.content).toBe('Olá, teste!');
      expect(message.messageType).toBe(MessageType.TEXT);
      expect(message.status).toBe(MessageStatus.SENT);
    });

    it('sends message with reply', async () => {
      server.use(
        http.post(`${API_BASE_URL}/messages`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'msg-new',
            conversationId: body.conversationId,
            senderId: 'user-1',
            senderPhone: '5511999999999',
            content: body.content,
            messageType: body.messageType,
            replyToId: body.replyToId,
            status: MessageStatus.SENT,
            createdAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const messageData = {
        conversationId: 'conv-1',
        content: 'Resposta',
        messageType: MessageType.TEXT,
        replyToId: 'msg-1',
      };

      const message = await messagesService.send(messageData);

      expect(message.replyToId).toBe('msg-1');
    });

    it('sends image message with metadata', async () => {
      server.use(
        http.post(`${API_BASE_URL}/messages`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'msg-new',
            conversationId: body.conversationId,
            senderId: 'user-1',
            senderPhone: '5511999999999',
            content: body.content,
            messageType: body.messageType,
            metadata: body.metadata,
            status: MessageStatus.SENT,
            createdAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const messageData = {
        conversationId: 'conv-1',
        messageType: MessageType.IMAGE,
        metadata: {
          mediaUrl: 'https://example.com/image.jpg',
          mimeType: 'image/jpeg',
          caption: 'Uma imagem',
        },
      };

      const message = await messagesService.send(messageData);

      expect(message.messageType).toBe(MessageType.IMAGE);
      expect(message.metadata?.mediaUrl).toBe('https://example.com/image.jpg');
    });
  });

  describe('markAsRead', () => {
    it('marks messages as read successfully', async () => {
      await expect(messagesService.markAsRead('conv-1')).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes message successfully', async () => {
      await expect(messagesService.delete('msg-1')).resolves.not.toThrow();
    });

    it('throws error for non-existent message', async () => {
      await expect(messagesService.delete('non-existent')).rejects.toThrow();
    });
  });
});
