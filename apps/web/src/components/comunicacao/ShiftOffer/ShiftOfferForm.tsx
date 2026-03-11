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
import { useTranslations } from 'next-intl';
import { useFormatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CreateShiftOfferDto } from '@/services/comunicacao/types';

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
  const t = useTranslations('Comunicacao');
  const tActions = useTranslations('Common.actions');
  const formatCurrency = useFormatCurrency();
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const hours = parseInt(expiresInHours, 10);
      if (isNaN(hours) || hours < 1 || hours > 168) {
        setError(t('shiftOffer.validationHours'));
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
        setError(err instanceof Error ? err.message : t('shiftOffer.sendError'));
      }
    },
    [conversationId, vagaId, recipientMedicoId, expiresInHours, onSubmit, t]
  );

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Vaga Info */}
      {vagaInfo && (
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="font-medium">{t('shiftOffer.vagaDetails')}</p>
          {vagaInfo.hospital && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t('shiftOffer.hospital')}:</span> {vagaInfo.hospital}
            </p>
          )}
          {vagaInfo.setor && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t('shiftOffer.sector')}:</span> {vagaInfo.setor}
            </p>
          )}
          {vagaInfo.data && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t('shiftOffer.date')}:</span>{' '}
              {new Date(vagaInfo.data).toLocaleDateString('pt-BR')}
            </p>
          )}
          {vagaInfo.horaInicio && vagaInfo.horaFim && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t('shiftOffer.schedule')}:</span>{' '}
              {vagaInfo.horaInicio} - {vagaInfo.horaFim}
            </p>
          )}
          {vagaInfo.valor !== undefined && (
            <p className="text-sm font-medium text-green-600">
              {t('shiftOffer.value')}: {formatCurrency(vagaInfo.valor)}
            </p>
          )}
        </div>
      )}

      {/* Expiration */}
      <div className="space-y-2">
        <Label htmlFor="expires">{t('shiftOffer.expirationLabel')}</Label>
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
          {t('shiftOffer.expirationHint')}
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
          {tActions('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('shiftOffer.sending') : t('shiftOffer.sendOffer')}
        </Button>
      </div>
    </form>
  );
}
