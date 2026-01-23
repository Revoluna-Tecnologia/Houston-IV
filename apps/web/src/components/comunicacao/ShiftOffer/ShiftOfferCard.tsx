'use client';

/**
 * ShiftOfferCard Component
 * Card que exibe uma oferta de plantao
 * SRP: Responsavel apenas pela UI de exibicao de oferta
 */

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShiftOfferStatus, type ShiftOffer } from '../../../services/comunicacao/types';

const CalendarIcon = () => (
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
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ClockIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MapPinIcon = () => (
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
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const DollarIcon = () => (
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
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const statusConfig: Record<
  ShiftOfferStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [ShiftOfferStatus.PENDING]: { label: 'Pendente', variant: 'outline' },
  [ShiftOfferStatus.ACCEPTED]: { label: 'Aceito', variant: 'default' },
  [ShiftOfferStatus.REJECTED]: { label: 'Recusado', variant: 'destructive' },
  [ShiftOfferStatus.EXPIRED]: { label: 'Expirado', variant: 'secondary' },
  [ShiftOfferStatus.CANCELLED]: { label: 'Cancelado', variant: 'secondary' },
};

export interface ShiftOfferCardProps {
  offer: ShiftOffer;
  isOwner?: boolean;
  onAccept?: (offer: ShiftOffer) => void;
  onReject?: (offer: ShiftOffer) => void;
  onCancel?: (offer: ShiftOffer) => void;
  className?: string;
}

function ShiftOfferCardComponent({
  offer,
  isOwner = false,
  onAccept,
  onReject,
  onCancel,
  className,
}: ShiftOfferCardProps) {
  const config = statusConfig[offer.status];
  const vaga = offer.vaga;

  const handleAccept = useCallback(() => {
    onAccept?.(offer);
  }, [offer, onAccept]);

  const handleReject = useCallback(() => {
    onReject?.(offer);
  }, [offer, onReject]);

  const handleCancel = useCallback(() => {
    onCancel?.(offer);
  }, [offer, onCancel]);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (time: string): string => {
    // Handle HH:mm format
    if (time.includes(':') && time.length <= 5) {
      return time;
    }
    // Handle ISO date string
    return new Date(time).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const isPending = offer.status === ShiftOfferStatus.PENDING;
  const showActions = isPending && (isOwner || (!isOwner && onAccept));

  // Get display values from vaga relation
  const hospitalName = vaga?.hospital?.nome;
  const setorName = vaga?.setor?.nome;
  const shiftDate = vaga?.data;
  const startTime = vaga?.horaInicio;
  const endTime = vaga?.horaFim;
  const value = vaga?.valor;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4',
        offer.status === ShiftOfferStatus.ACCEPTED && 'border-green-200 bg-green-50',
        offer.status === ShiftOfferStatus.REJECTED && 'border-red-200 bg-red-50',
        offer.status === ShiftOfferStatus.EXPIRED && 'opacity-60',
        offer.status === ShiftOfferStatus.CANCELLED && 'opacity-60',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-semibold">
            {hospitalName || 'Oferta de Plantão'}
          </h4>
          {setorName && (
            <p className="text-sm text-muted-foreground">{setorName}</p>
          )}
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {/* Details */}
      <div className="mb-4 space-y-2 text-sm">
        {shiftDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon />
            <span>{formatDate(shiftDate)}</span>
          </div>
        )}

        {startTime && endTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon />
            <span>
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
        )}

        {hospitalName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon />
            <span>{hospitalName}</span>
          </div>
        )}

        {value !== undefined && value > 0 && (
          <div className="flex items-center gap-2 font-medium text-green-600">
            <DollarIcon />
            <span>{formatCurrency(value)}</span>
          </div>
        )}
      </div>

      {/* Recipient info */}
      {offer.recipientMedico && (
        <p className="mb-4 text-sm text-muted-foreground">
          Para: {offer.recipientMedico.nome}
        </p>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="w-full"
            >
              Cancelar oferta
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                className="flex-1"
              >
                Recusar
              </Button>
              <Button size="sm" onClick={handleAccept} className="flex-1">
                Aceitar
              </Button>
            </>
          )}
        </div>
      )}

      {/* Response info */}
      {offer.status === ShiftOfferStatus.ACCEPTED && offer.respondedAt && (
        <p className="mt-2 text-xs text-green-600">
          Aceito em {new Date(offer.respondedAt).toLocaleString('pt-BR')}
        </p>
      )}

      {offer.status === ShiftOfferStatus.REJECTED && offer.respondedAt && (
        <p className="mt-2 text-xs text-red-600">
          Recusado em {new Date(offer.respondedAt).toLocaleString('pt-BR')}
        </p>
      )}

      {/* Expiry info */}
      {isPending && offer.expiresAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Expira em {new Date(offer.expiresAt).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}

export const ShiftOfferCard = memo(ShiftOfferCardComponent);
