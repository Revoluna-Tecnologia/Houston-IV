import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server';
import { whatsappService } from '../whatsapp-service';
import { WhatsAppInstanceStatus } from '../types';
import { mockWhatsAppInstance } from './mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('WhatsAppService', () => {
  describe('getByGrupo', () => {
    it('fetches instance by grupo id successfully', async () => {
      const instance = await whatsappService.getByGrupo('grupo-1');

      expect(instance).not.toBeNull();
      expect(instance?.id).toBe(mockWhatsAppInstance.id);
      expect(instance?.grupoId).toBe('grupo-1');
    });

    it('returns null for grupo without instance', async () => {
      const instance = await whatsappService.getByGrupo('grupo-99');

      expect(instance).toBeNull();
    });
  });

  describe('getById', () => {
    it('fetches instance by id successfully', async () => {
      const instance = await whatsappService.getById(mockWhatsAppInstance.id);

      expect(instance.id).toBe(mockWhatsAppInstance.id);
      expect(instance.instanceName).toBe(mockWhatsAppInstance.instanceName);
    });

    it('throws error for non-existent instance', async () => {
      await expect(whatsappService.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates instance successfully', async () => {
      const instanceData = {
        instanceName: 'WhatsApp Teste',
        grupoId: 'grupo-1',
      };

      const instance = await whatsappService.create(instanceData);

      expect(instance).toHaveProperty('id');
      expect(instance.instanceName).toBe('WhatsApp Teste');
      expect(instance.status).toBe(WhatsAppInstanceStatus.DISCONNECTED);
    });

    it('creates instance with default grupoId', async () => {
      server.use(
        http.post(`${API_BASE_URL}/whatsapp/instances`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'instance-new',
            grupoId: body.grupoId || 'grupo-default',
            provider: 'zapster',
            providerInstanceId: 'zap-new',
            instanceName: body.instanceName,
            status: WhatsAppInstanceStatus.DISCONNECTED,
            createdById: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const instance = await whatsappService.create({ instanceName: 'Novo WhatsApp' });

      expect(instance).toHaveProperty('id');
    });
  });

  describe('connect', () => {
    it('connects instance successfully', async () => {
      await expect(whatsappService.connect(mockWhatsAppInstance.id)).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('disconnects instance successfully', async () => {
      await expect(whatsappService.disconnect(mockWhatsAppInstance.id)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes instance successfully', async () => {
      await expect(whatsappService.delete(mockWhatsAppInstance.id)).resolves.not.toThrow();
    });

    it('throws error for non-existent instance', async () => {
      await expect(whatsappService.delete('non-existent')).rejects.toThrow();
    });
  });

  describe('getQRCode', () => {
    it('fetches QR code successfully', async () => {
      const response = await whatsappService.getQRCode(mockWhatsAppInstance.id);

      expect(response).toHaveProperty('qr');
      expect(response).toHaveProperty('expiresAt');
      expect(response.qr).toContain('data:image');
    });
  });

  describe('getPairingCode', () => {
    it('fetches pairing code successfully', async () => {
      const response = await whatsappService.getPairingCode(mockWhatsAppInstance.id, '5511999999999');

      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('expiresAt');
      expect(response.code).toMatch(/^[A-Z]{3}-\d{5}$/);
    });
  });

  describe('getConnectionStatus', () => {
    it('fetches connection status for connected instance', async () => {
      const response = await whatsappService.getConnectionStatus(mockWhatsAppInstance.id);

      expect(response.status).toBe(WhatsAppInstanceStatus.CONNECTED);
      expect(response.isConnected).toBe(true);
      expect(response.phoneNumber).toBe('5511999999999');
    });

    it('fetches connection status for disconnected instance', async () => {
      const response = await whatsappService.getConnectionStatus('instance-disconnected');

      expect(response.status).toBe(WhatsAppInstanceStatus.DISCONNECTED);
      expect(response.isConnected).toBe(false);
    });
  });

  describe('restart', () => {
    it('restarts instance successfully', async () => {
      await expect(whatsappService.restart(mockWhatsAppInstance.id)).resolves.not.toThrow();
    });
  });
});
