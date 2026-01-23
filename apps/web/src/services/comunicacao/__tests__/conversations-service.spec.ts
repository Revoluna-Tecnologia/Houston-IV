import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server';
import { conversationsService } from '../conversations-service';
import { ConversationType } from '../types';
import { mockConversations } from './mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('ConversationsService', () => {
  describe('getAll', () => {
    it('fetches all conversations successfully', async () => {
      const response = await conversationsService.getAll();

      expect(response.data).toHaveLength(mockConversations.length);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page');
      expect(response.meta).toHaveProperty('limit');
    });

    it('fetches conversations with type filter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/conversations`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockConversations.filter((c) => c.type === ConversationType.DIRECT),
            meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await conversationsService.getAll({ type: ConversationType.DIRECT });

      expect(capturedUrl).toContain('type=direct');
    });

    it('fetches conversations with search filter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/conversations`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await conversationsService.getAll({ search: 'teste' });

      expect(capturedUrl).toContain('search=teste');
    });

    it('handles empty response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/conversations`, () => {
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      const response = await conversationsService.getAll();

      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('fetches conversation by id successfully', async () => {
      const conversation = await conversationsService.getById('conv-1');

      expect(conversation.id).toBe('conv-1');
      expect(conversation).toHaveProperty('type');
      expect(conversation).toHaveProperty('createdAt');
    });

    it('throws error for non-existent conversation', async () => {
      await expect(conversationsService.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates conversation successfully', async () => {
      const conversationData = {
        type: ConversationType.DIRECT,
        participantPhones: ['5511999999999'],
      };

      const conversation = await conversationsService.create(conversationData);

      expect(conversation).toHaveProperty('id');
      expect(conversation.type).toBe(ConversationType.DIRECT);
    });

    it('creates group conversation with name', async () => {
      const conversationData = {
        type: ConversationType.GROUP,
        name: 'Grupo Teste',
        participantPhones: ['5511999999999', '5511888888888'],
      };

      server.use(
        http.post(`${API_BASE_URL}/conversations`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'conv-new',
            type: body.type,
            name: body.name,
            createdById: 'user-1',
            grupoId: 'grupo-1',
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const conversation = await conversationsService.create(conversationData);

      expect(conversation.name).toBe('Grupo Teste');
      expect(conversation.type).toBe(ConversationType.GROUP);
    });
  });

  describe('archive', () => {
    it('archives conversation successfully', async () => {
      await expect(conversationsService.archive('conv-1', true)).resolves.not.toThrow();
    });

    it('unarchives conversation successfully', async () => {
      await expect(conversationsService.archive('conv-1', false)).resolves.not.toThrow();
    });

    it('throws error for non-existent conversation', async () => {
      await expect(conversationsService.archive('non-existent', true)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes conversation successfully', async () => {
      await expect(conversationsService.delete('conv-1')).resolves.not.toThrow();
    });

    it('throws error for non-existent conversation', async () => {
      await expect(conversationsService.delete('non-existent')).rejects.toThrow();
    });
  });
});
