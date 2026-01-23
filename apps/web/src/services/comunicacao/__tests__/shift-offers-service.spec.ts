import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server';
import { shiftOffersService } from '../shift-offers-service';
import { ShiftOfferStatus } from '../types';
import { mockShiftOffers } from './mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('ShiftOffersService', () => {
  describe('getAll', () => {
    it('fetches all shift offers successfully', async () => {
      const response = await shiftOffersService.getAll();

      expect(response.data).toHaveLength(mockShiftOffers.length);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page');
    });

    it('fetches shift offers with status filter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/shift-offers`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockShiftOffers.filter((o) => o.status === ShiftOfferStatus.PENDING),
            meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await shiftOffersService.getAll({ status: ShiftOfferStatus.PENDING });

      expect(capturedUrl).toContain('status=pending');
    });

    it('handles empty response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/shift-offers`, () => {
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      const response = await shiftOffersService.getAll();

      expect(response.data).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('fetches shift offer by id successfully', async () => {
      const offer = await shiftOffersService.getById('offer-1');

      expect(offer.id).toBe('offer-1');
      expect(offer).toHaveProperty('vagaId');
      expect(offer).toHaveProperty('status');
    });

    it('throws error for non-existent offer', async () => {
      await expect(shiftOffersService.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates shift offer successfully', async () => {
      const offerData = {
        conversationId: 'conv-1',
        vagaId: 'vaga-2',
        recipientMedicoId: 'medico-2',
        expiresInHours: 24,
      };

      const offer = await shiftOffersService.create(offerData);

      expect(offer).toHaveProperty('id');
      expect(offer.vagaId).toBe('vaga-2');
      expect(offer.recipientMedicoId).toBe('medico-2');
      expect(offer.status).toBe(ShiftOfferStatus.PENDING);
    });

    it('creates shift offer with custom expiration', async () => {
      server.use(
        http.post(`${API_BASE_URL}/shift-offers`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          const expiresInHours = (body.expiresInHours as number) || 24;
          return HttpResponse.json({
            id: 'offer-new',
            conversationId: body.conversationId,
            vagaId: body.vagaId,
            senderUserId: 'user-1',
            recipientMedicoId: body.recipientMedicoId,
            status: ShiftOfferStatus.PENDING,
            expiresAt: new Date(Date.now() + expiresInHours * 3600000).toISOString(),
            createdAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const offerData = {
        conversationId: 'conv-1',
        vagaId: 'vaga-2',
        recipientMedicoId: 'medico-2',
        expiresInHours: 48,
      };

      const offer = await shiftOffersService.create(offerData);
      const expiresAt = new Date(offer.expiresAt);
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / 3600000;

      expect(diffHours).toBeGreaterThan(47);
      expect(diffHours).toBeLessThan(49);
    });

    it('creates shift offer with default 24h expiration', async () => {
      const offerData = {
        conversationId: 'conv-1',
        vagaId: 'vaga-2',
        recipientMedicoId: 'medico-2',
      };

      const offer = await shiftOffersService.create(offerData);
      const expiresAt = new Date(offer.expiresAt);
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / 3600000;

      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });
  });

  describe('respond', () => {
    it('accepts shift offer successfully', async () => {
      const offer = await shiftOffersService.respond('offer-1', { action: 'accept' });

      expect(offer.status).toBe(ShiftOfferStatus.ACCEPTED);
      expect(offer.respondedAt).toBeDefined();
    });

    it('rejects shift offer successfully', async () => {
      const offer = await shiftOffersService.respond('offer-1', { action: 'reject' });

      expect(offer.status).toBe(ShiftOfferStatus.REJECTED);
      expect(offer.respondedAt).toBeDefined();
    });

    it('throws error for non-existent offer', async () => {
      await expect(shiftOffersService.respond('non-existent', { action: 'accept' })).rejects.toThrow();
    });
  });

  describe('cancel', () => {
    it('cancels shift offer successfully', async () => {
      await expect(shiftOffersService.cancel('offer-1')).resolves.not.toThrow();
    });

    it('throws error for non-existent offer', async () => {
      await expect(shiftOffersService.cancel('non-existent')).rejects.toThrow();
    });
  });
});
