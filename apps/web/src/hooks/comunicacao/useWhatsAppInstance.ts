'use client';

/**
 * useWhatsAppInstance Hook
 * Gerencia instancia WhatsApp do grupo
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { whatsappService } from '../../services/comunicacao/whatsapp-service';
import {
  WhatsAppInstanceStatus,
  type WhatsAppInstance,
  type CreateWhatsAppInstanceDto,
} from '../../services/comunicacao/types';

const STATUS_POLL_INTERVAL = 5000; // 5 seconds

export interface UseWhatsAppInstanceOptions {
  grupoId: string;
  autoFetch?: boolean;
}

export interface UseWhatsAppInstanceReturn {
  instance: WhatsAppInstance | null;
  qrCode: string | null;
  pairingCode: string | null;
  status: WhatsAppInstanceStatus | null;
  phoneNumber: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateWhatsAppInstanceDto) => Promise<WhatsAppInstance>;
  delete: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshQR: () => Promise<void>;
  getPairingCode: (phoneNumber: string) => Promise<string>;
  restart: () => Promise<void>;
}

export function useWhatsAppInstance(options: UseWhatsAppInstanceOptions): UseWhatsAppInstanceReturn {
  const { grupoId, autoFetch = true } = options;

  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppInstanceStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isConnected = status === WhatsAppInstanceStatus.CONNECTED;

  // Fetch instance
  const fetchInstance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const inst = await whatsappService.getByGrupo(grupoId);
      setInstance(inst);
      if (inst) {
        setStatus(inst.status);
        setPhoneNumber(inst.phoneNumber || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch instance'));
    } finally {
      setIsLoading(false);
    }
  }, [grupoId]);

  useEffect(() => {
    if (autoFetch) {
      fetchInstance();
    }
  }, [autoFetch, fetchInstance]);

  // Poll status when connecting
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      if (instance?.id) {
        try {
          const statusResponse = await whatsappService.getConnectionStatus(instance.id);
          setStatus(statusResponse.status);
          setPhoneNumber(statusResponse.phoneNumber || null);

          if (statusResponse.isConnected) {
            setIsConnecting(false);
            setQrCode(null);
            setPairingCode(null);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch {
          // Ignore polling errors
        }
      }
    }, STATUS_POLL_INTERVAL);
  }, [instance?.id]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Actions
  const create = useCallback(async (data: CreateWhatsAppInstanceDto): Promise<WhatsAppInstance> => {
    const newInstance = await whatsappService.create({ ...data, grupoId });
    setInstance(newInstance);
    setStatus(newInstance.status);
    return newInstance;
  }, [grupoId]);

  const deleteInstance = useCallback(async (): Promise<void> => {
    if (instance?.id) {
      await whatsappService.delete(instance.id);
      setInstance(null);
      setStatus(null);
      setQrCode(null);
      setPairingCode(null);
      setPhoneNumber(null);
      stopPolling();
    }
  }, [instance?.id, stopPolling]);

  const connect = useCallback(async (): Promise<void> => {
    if (instance?.id) {
      setIsConnecting(true);
      setError(null);
      try {
        await whatsappService.connect(instance.id);
        // Get QR code
        const qrResponse = await whatsappService.getQRCode(instance.id);
        setQrCode(qrResponse.qr);
        startPolling();
      } catch (err) {
        setIsConnecting(false);
        setError(err instanceof Error ? err : new Error('Failed to connect'));
        throw err;
      }
    }
  }, [instance?.id, startPolling]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (instance?.id) {
      await whatsappService.disconnect(instance.id);
      setStatus(WhatsAppInstanceStatus.DISCONNECTED);
      setPhoneNumber(null);
      setQrCode(null);
      setPairingCode(null);
      stopPolling();
    }
  }, [instance?.id, stopPolling]);

  const refreshQR = useCallback(async (): Promise<void> => {
    if (instance?.id) {
      const qrResponse = await whatsappService.getQRCode(instance.id);
      setQrCode(qrResponse.qr);
    }
  }, [instance?.id]);

  const getPairingCodeFn = useCallback(async (phone: string): Promise<string> => {
    if (instance?.id) {
      const response = await whatsappService.getPairingCode(instance.id, phone);
      setPairingCode(response.code);
      return response.code;
    }
    throw new Error('No instance available');
  }, [instance?.id]);

  const restart = useCallback(async (): Promise<void> => {
    if (instance?.id) {
      setIsConnecting(true);
      try {
        await whatsappService.restart(instance.id);
        startPolling();
      } catch (err) {
        setIsConnecting(false);
        throw err;
      }
    }
  }, [instance?.id, startPolling]);

  return {
    instance,
    qrCode,
    pairingCode,
    status,
    phoneNumber,
    isLoading,
    isConnecting,
    isConnected,
    error,
    refetch: fetchInstance,
    create,
    delete: deleteInstance,
    connect,
    disconnect,
    refreshQR,
    getPairingCode: getPairingCodeFn,
    restart,
  };
}
