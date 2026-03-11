'use client';

/**
 * AddContactModal Component
 * Modal para adicionar novo contato
 * SRP: Responsavel pelo container modal, delegando form para AddContactForm
 */

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddContactForm } from './AddContactForm';
import type { CreateContactDto } from '@/services/comunicacao/types';

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
  const t = useTranslations('Comunicacao');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('contacts.addContactTitle')}</DialogTitle>
          <DialogDescription>
            {t('contacts.addContactDescription')}
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
