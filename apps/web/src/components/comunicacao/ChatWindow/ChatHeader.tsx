'use client';

/**
 * ChatHeader Component
 * Cabecalho do chat com informacoes e acoes
 * SRP: Responsavel apenas pela UI do cabecalho
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationType } from '../../../services/comunicacao/types';

const ArrowLeftIcon = () => (
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
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const MoreVerticalIcon = () => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const UserIcon = () => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UsersIcon = () => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  onArchive?: (archive: boolean) => void;
  onDelete?: () => void;
  onViewParticipants?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ChatHeader({
  conversation,
  onBack,
  onArchive,
  onDelete,
  onViewParticipants,
  showBackButton = false,
  className,
}: ChatHeaderProps) {
  const displayName = useMemo(() => {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === ('direct' as ConversationType) && conversation.participants) {
      const otherParticipant = conversation.participants[0];
      return (
        otherParticipant?.user?.name ||
        otherParticipant?.medico?.nome ||
        otherParticipant?.phoneNumber ||
        'Conversa'
      );
    }

    return 'Grupo';
  }, [conversation]);

  const participantCount = conversation.participants?.length || 0;
  const isGroup = conversation.type === ('group' as ConversationType);

  return (
    <header
      className={cn(
        'flex items-center gap-3 border-b bg-background px-4 py-3',
        className
      )}
    >
      {showBackButton && (
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
          <ArrowLeftIcon />
          <span className="sr-only">Voltar</span>
        </Button>
      )}

      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isGroup ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        )}
      >
        {isGroup ? <UsersIcon /> : <UserIcon />}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{displayName}</h3>
        {isGroup && participantCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {participantCount} participante{participantCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Opcoes</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isGroup && onViewParticipants && (
            <DropdownMenuItem onClick={onViewParticipants}>
              Ver participantes
            </DropdownMenuItem>
          )}
          {onArchive && (
            <DropdownMenuItem onClick={() => onArchive(!conversation.isArchived)}>
              {conversation.isArchived ? 'Desarquivar' : 'Arquivar'}
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Excluir conversa
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
