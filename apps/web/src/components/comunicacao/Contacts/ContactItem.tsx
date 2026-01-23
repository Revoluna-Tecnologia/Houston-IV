'use client';

/**
 * ContactItem Component
 * Exibe um contato individual na lista
 * SRP: Responsavel apenas pela UI de um item de contato
 */

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Contact } from '../../../services/comunicacao/types';

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', filled ? 'text-yellow-500' : 'text-muted-foreground')}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MessageIcon = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BlockIcon = () => (
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
    <path d="m4.9 4.9 14.2 14.2" />
  </svg>
);

export interface ContactItemProps {
  contact: Contact;
  isSelected?: boolean;
  onSelect?: (contact: Contact) => void;
  onStartChat?: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
  onToggleBlock?: (contact: Contact) => void;
  className?: string;
}

function ContactItemComponent({
  contact,
  isSelected = false,
  onSelect,
  onStartChat,
  onToggleFavorite,
  onToggleBlock,
  className,
}: ContactItemProps) {
  const handleClick = useCallback(() => {
    onSelect?.(contact);
  }, [contact, onSelect]);

  const handleStartChat = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStartChat?.(contact);
    },
    [contact, onStartChat]
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.(contact);
    },
    [contact, onToggleFavorite]
  );

  const handleToggleBlock = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleBlock?.(contact);
    },
    [contact, onToggleBlock]
  );

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        'flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer',
        'hover:bg-muted/50',
        isSelected && 'bg-muted',
        contact.isBlocked && 'opacity-50',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          contact.isBlocked ? 'bg-gray-200 text-gray-500' : 'bg-primary/10 text-primary'
        )}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('truncate font-medium', contact.isBlocked && 'line-through')}>
            {contact.name}
          </p>
          {contact.isFavorite && <StarIcon filled />}
        </div>
        <p className="truncate text-sm text-muted-foreground">{formatPhone(contact.phoneNumber)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className="h-8 w-8"
          title={contact.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <StarIcon filled={contact.isFavorite} />
        </Button>

        {!contact.isBlocked && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartChat}
            className="h-8 w-8"
            title="Iniciar conversa"
          >
            <MessageIcon />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleBlock}
          className={cn('h-8 w-8', contact.isBlocked && 'text-red-500')}
          title={contact.isBlocked ? 'Desbloquear' : 'Bloquear'}
        >
          <BlockIcon />
        </Button>
      </div>
    </div>
  );
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 7);
    const part2 = digits.slice(7);
    return `(${ddd}) ${part1}-${part2}`;
  }

  return phone;
}

export const ContactItem = memo(ContactItemComponent);
