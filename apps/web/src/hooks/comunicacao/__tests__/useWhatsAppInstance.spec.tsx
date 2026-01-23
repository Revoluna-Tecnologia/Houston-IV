import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWhatsAppInstance } from '../useWhatsAppInstance';
import { whatsappService } from '../../../services/comunicacao/whatsapp-service';
import { WhatsAppInstanceStatus } from '../../../services/comunicacao/types';
import type { WhatsAppInstance } from '../../../services/comunicacao/types';

// Mock services
vi.mock('../../../services/comunicacao/whatsapp-service', () => ({
  whatsappService: {
    getByGrupo: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    getQRCode: vi.fn(),
    getPairingCode: vi.fn(),
    getConnectionStatus: vi.fn(),
    restart: vi.fn(),
  },
}));

const mockInstance: WhatsAppInstance = {
  id: 'instance-1',
  grupoId: 'grupo-1',
  instanceName: 'Test Instance',
  status: WhatsAppInstanceStatus.DISCONNECTED,
  phoneNumber: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockConnectedInstance: WhatsAppInstance = {
  ...mockInstance,
  status: WhatsAppInstanceStatus.CONNECTED,
  phoneNumber: '5511999999999',
};

describe('useWhatsAppInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading state', () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.instance).toBeNull();
      expect(result.current.status).toBeNull();
    });

    it('fetches instance on mount when autoFetch is true', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1', autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(whatsappService.getByGrupo).toHaveBeenCalledWith('grupo-1');
      expect(result.current.instance).toEqual(mockInstance);
      expect(result.current.status).toBe(WhatsAppInstanceStatus.DISCONNECTED);
    });

    it('does not fetch when autoFetch is false', () => {
      renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1', autoFetch: false })
      );

      expect(whatsappService.getByGrupo).not.toHaveBeenCalled();
    });
  });

  describe('fetching instance', () => {
    it('fetches instance successfully', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.instance).toEqual(mockInstance);
      expect(result.current.error).toBeNull();
    });

    it('handles null instance (no instance exists)', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(null);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.instance).toBeNull();
      expect(result.current.status).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(whatsappService.getByGrupo).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.instance).toBeNull();
    });

    it('sets phoneNumber from connected instance', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockConnectedInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.phoneNumber).toBe('5511999999999');
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('returns true when status is CONNECTED', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockConnectedInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('returns false when status is not CONNECTED', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('create', () => {
    it('creates new instance', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(null);
      vi.mocked(whatsappService.create).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: WhatsAppInstance | undefined;
      await act(async () => {
        created = await result.current.create({ instanceName: 'New Instance' });
      });

      expect(whatsappService.create).toHaveBeenCalledWith({
        instanceName: 'New Instance',
        grupoId: 'grupo-1',
      });
      expect(created).toEqual(mockInstance);
      expect(result.current.instance).toEqual(mockInstance);
    });
  });

  describe('delete', () => {
    it('deletes instance and clears state', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.instance).not.toBeNull();

      await act(async () => {
        await result.current.delete();
      });

      expect(whatsappService.delete).toHaveBeenCalledWith('instance-1');
      expect(result.current.instance).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.qrCode).toBeNull();
      expect(result.current.pairingCode).toBeNull();
    });
  });

  describe('connect', () => {
    it('connects instance and gets QR code', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.connect).mockResolvedValue(undefined);
      vi.mocked(whatsappService.getQRCode).mockResolvedValue({
        qr: 'data:image/png;base64,qrcode',
        expiresAt: new Date(Date.now() + 60000),
      });

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.connect();
      });

      expect(whatsappService.connect).toHaveBeenCalledWith('instance-1');
      expect(whatsappService.getQRCode).toHaveBeenCalledWith('instance-1');
      expect(result.current.qrCode).toBe('data:image/png;base64,qrcode');
      expect(result.current.isConnecting).toBe(true);
    });

    it('handles connect error', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.connect).mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Expect connection to fail and throw
      let didThrow = false;
      try {
        await act(async () => {
          await result.current.connect();
        });
      } catch {
        didThrow = true;
      }

      expect(didThrow).toBe(true);
      // After error, isConnecting should be false
      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('disconnects instance and clears connection state', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockConnectedInstance);
      vi.mocked(whatsappService.disconnect).mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);

      await act(async () => {
        await result.current.disconnect();
      });

      expect(whatsappService.disconnect).toHaveBeenCalledWith('instance-1');
      expect(result.current.status).toBe(WhatsAppInstanceStatus.DISCONNECTED);
      expect(result.current.phoneNumber).toBeNull();
      expect(result.current.qrCode).toBeNull();
    });
  });

  describe('refreshQR', () => {
    it('refreshes QR code', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.getQRCode).mockResolvedValue({
        qr: 'data:image/png;base64,newqrcode',
        expiresAt: new Date(Date.now() + 60000),
      });

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshQR();
      });

      expect(whatsappService.getQRCode).toHaveBeenCalledWith('instance-1');
      expect(result.current.qrCode).toBe('data:image/png;base64,newqrcode');
    });
  });

  describe('getPairingCode', () => {
    it('gets pairing code for phone number', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.getPairingCode).mockResolvedValue({
        code: '12345678',
      });

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let code: string | undefined;
      await act(async () => {
        code = await result.current.getPairingCode('5511999999999');
      });

      expect(whatsappService.getPairingCode).toHaveBeenCalledWith('instance-1', '5511999999999');
      expect(code).toBe('12345678');
      expect(result.current.pairingCode).toBe('12345678');
    });

    it('throws error when no instance available', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(null);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.getPairingCode('5511999999999');
        })
      ).rejects.toThrow('No instance available');
    });
  });

  describe('restart', () => {
    it('restarts instance', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.restart).mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restart();
      });

      expect(whatsappService.restart).toHaveBeenCalledWith('instance-1');
      expect(result.current.isConnecting).toBe(true);
    });
  });

  describe('refetch', () => {
    it('refetches instance', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(whatsappService.getByGrupo).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(whatsappService.getByGrupo).toHaveBeenCalledTimes(2);
    });
  });

  describe('polling', () => {
    it('starts polling when connecting', async () => {
      vi.mocked(whatsappService.getByGrupo).mockResolvedValue(mockInstance);
      vi.mocked(whatsappService.connect).mockResolvedValue(undefined);
      vi.mocked(whatsappService.getQRCode).mockResolvedValue({
        qr: 'data:image/png;base64,qrcode',
        expiresAt: new Date(Date.now() + 60000),
      });

      const { result } = renderHook(() =>
        useWhatsAppInstance({ grupoId: 'grupo-1' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.connect();
      });

      // After connect, isConnecting should be true and polling started
      expect(result.current.isConnecting).toBe(true);
      expect(result.current.qrCode).toBe('data:image/png;base64,qrcode');
    });
  });
});
