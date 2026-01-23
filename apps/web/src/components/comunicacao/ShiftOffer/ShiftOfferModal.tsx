'use client';

/**
 * ShiftOfferModal Component
 * Modal para criar oferta de plantao
 * SRP: Responsavel pelo container modal, delegando form para ShiftOfferForm
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShiftOfferForm } from './ShiftOfferForm';
import type { CreateShiftOfferDto } from '../../../services/comunicacao/types';

export interface ShiftOfferModalProps {
  isOpen: boolean;
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
  onClose: () => void;
  onSubmit: (data: CreateShiftOfferDto) => Promise<void>;
}

export function ShiftOfferModal({
  isOpen,
  conversationId,
  vagaId,
  recipientMedicoId,
  vagaInfo,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ShiftOfferModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Oferecer plantão</DialogTitle>
          <DialogDescription>
            Envie uma proposta de plantão para esta conversa
          </DialogDescription>
        </DialogHeader>

        <ShiftOfferForm
          conversationId={conversationId}
          vagaId={vagaId}
          recipientMedicoId={recipientMedicoId}
          vagaInfo={vagaInfo}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
