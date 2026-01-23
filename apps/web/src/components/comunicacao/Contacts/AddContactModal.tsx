'use client';

/**
 * AddContactModal Component
 * Modal para adicionar novo contato
 * SRP: Responsavel pelo container modal, delegando form para AddContactForm
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddContactForm } from './AddContactForm';
import type { CreateContactDto } from '../../../services/comunicacao/types';

export interface AddContactModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactDto) => Promise<void>;
}

export function AddContactModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddContactModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar contato</DialogTitle>
          <DialogDescription>
            Adicione um novo contato para iniciar conversas
          </DialogDescription>
        </DialogHeader>

        <AddContactForm
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
