'use client';

/**
 * QRCodeDisplay Component
 * Exibe QR Code para conexao WhatsApp
 * SRP: Responsavel pela UI do QR Code e codigo de pareamento
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const SmartphoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

export interface QRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onGetPairingCode: (phoneNumber: string) => Promise<void>;
  expiresAt?: string;
  className?: string;
}

export function QRCodeDisplay({
  qrCode,
  pairingCode,
  isLoading,
  onRefresh,
  onGetPairingCode,
  expiresAt,
  className,
}: QRCodeDisplayProps) {
  const [showPairingInput, setShowPairingInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isGettingCode, setIsGettingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGetPairingCode = useCallback(async () => {
    if (!phoneNumber.trim()) return;

    setIsGettingCode(true);
    try {
      await onGetPairingCode(phoneNumber);
    } finally {
      setIsGettingCode(false);
    }
  }, [phoneNumber, onGetPairingCode]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* QR Code */}
      <div className="relative">
        {isLoading ? (
          <Skeleton className="h-64 w-64 rounded-lg" />
        ) : qrCode ? (
          <div className="relative">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code para conexao WhatsApp"
              className="h-64 w-64 rounded-lg"
            />
            {timeLeft !== null && timeLeft <= 30 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <Button variant="secondary" onClick={onRefresh}>
                  <RefreshIcon />
                  <span className="ml-2">Atualizar QR</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground">
              Clique em conectar para gerar o QR Code
            </p>
          </div>
        )}
      </div>

      {/* Timer */}
      {timeLeft !== null && timeLeft > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Expira em {formatTime(timeLeft)}
        </p>
      )}

      {/* Refresh button */}
      {qrCode && !isLoading && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="mt-3"
        >
          <RefreshIcon />
          <span className="ml-2">Atualizar QR Code</span>
        </Button>
      )}

      {/* Divider */}
      <div className="my-6 flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Pairing code option */}
      {!showPairingInput ? (
        <Button
          variant="outline"
          onClick={() => setShowPairingInput(true)}
          className="w-full max-w-xs"
        >
          <SmartphoneIcon />
          <span className="ml-2">Conectar com codigo</span>
        </Button>
      ) : pairingCode ? (
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Digite este codigo no WhatsApp:
          </p>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-mono text-2xl font-bold tracking-widest">
              {pairingCode}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Acesse Configuracoes &gt; Aparelhos conectados &gt; Conectar um aparelho
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Numero do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+55 11 99999-9999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isGettingCode}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPairingInput(false)}
              disabled={isGettingCode}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGetPairingCode}
              disabled={!phoneNumber.trim() || isGettingCode}
              className="flex-1"
            >
              {isGettingCode ? 'Gerando...' : 'Gerar codigo'}
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
        <p className="font-medium">Como conectar:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
          <li>Abra o WhatsApp no seu celular</li>
          <li>Acesse Configuracoes &gt; Aparelhos conectados</li>
          <li>Toque em &quot;Conectar um aparelho&quot;</li>
          <li>Aponte a camera para o QR Code ou use o codigo</li>
        </ol>
      </div>
    </div>
  );
}
