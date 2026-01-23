'use client';

/**
 * ShiftOfferForm Component
 * Formulario para criar oferta de plantao
 * SRP: Responsavel apenas pelo formulario de criacao de oferta
 *
 * Nota: Este componente recebe vagaId e recipientMedicoId como props
 * pois a selecao de vagas e medicos deve ser feita por componentes externos
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CreateShiftOfferDto } from '../../../services/comunicacao/types';

export interface ShiftOfferFormProps {
  conversationId: string;
  vagaId: string;
  recipientMedicoId: string;
  vagaInfo?: {
    hospital?: string;
    setor?: string;
    data?: string;
    horaInicio?: string;
    horaFim?: string;
    valor?: number;
  };
  isSubmitting?: boolean;
  onSubmit: (data: CreateShiftOfferDto) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function ShiftOfferForm({
  conversationId,
  vagaId,
  recipientMedicoId,
  vagaInfo,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: ShiftOfferFormProps) {
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const hours = parseInt(expiresInHours, 10);
      if (isNaN(hours) || hours < 1 || hours > 168) {
        setError('Validade deve ser entre 1 e 168 horas (7 dias)');
        return;
      }

      try {
        await onSubmit({
          conversationId,
          vagaId,
          recipientMedicoId,
          expiresInHours: hours,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar oferta');
      }
    },
    [conversationId, vagaId, recipientMedicoId, expiresInHours, onSubmit]
  );

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Vaga Info */}
      {vagaInfo && (
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="font-medium">Detalhes da Vaga</p>
          {vagaInfo.hospital && (
            <p className="text-sm">
              <span className="text-muted-foreground">Hospital:</span> {vagaInfo.hospital}
            </p>
          )}
          {vagaInfo.setor && (
            <p className="text-sm">
              <span className="text-muted-foreground">Setor:</span> {vagaInfo.setor}
            </p>
          )}
          {vagaInfo.data && (
            <p className="text-sm">
              <span className="text-muted-foreground">Data:</span>{' '}
              {new Date(vagaInfo.data).toLocaleDateString('pt-BR')}
            </p>
          )}
          {vagaInfo.horaInicio && vagaInfo.horaFim && (
            <p className="text-sm">
              <span className="text-muted-foreground">Horário:</span>{' '}
              {vagaInfo.horaInicio} - {vagaInfo.horaFim}
            </p>
          )}
          {vagaInfo.valor !== undefined && (
            <p className="text-sm font-medium text-green-600">
              Valor: {formatCurrency(vagaInfo.valor)}
            </p>
          )}
        </div>
      )}

      {/* Expiration */}
      <div className="space-y-2">
        <Label htmlFor="expires">Validade da oferta (horas)</Label>
        <Input
          id="expires"
          type="number"
          min="1"
          max="168"
          value={expiresInHours}
          onChange={(e) => setExpiresInHours(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          A oferta expira automaticamente após esse período
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar oferta'}
        </Button>
      </div>
    </form>
  );
}
