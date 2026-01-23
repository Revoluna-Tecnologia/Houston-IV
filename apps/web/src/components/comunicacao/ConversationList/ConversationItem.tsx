'use client';

/**
 * ConversationItem Component
 * Renderiza um item individual na lista de conversas
 * SRP: Responsavel apenas pela UI de um item de conversa
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation, ConversationType } from '../../../services/comunicacao/types';

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

const ArchiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3 w-3"
  >
    <rect width="20" height="5" x="2" y="3" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
);

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const displayName = useMemo(() => {
    if (conversation.name) {
      return conversation.name;
    }

    // Para conversas diretas, mostrar nome do outro participante
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

  const formattedTime = useMemo(() => {
    if (!conversation.lastMessageAt) return null;

    try {
      return formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: false,
        locale: ptBR,
      });
    } catch {
      return null;
    }
  }, [conversation.lastMessageAt]);

  const hasUnread = (conversation.unreadCount ?? 0) > 0;
  const isGroup = conversation.type === ('group' as ConversationType);

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-muted',
        hasUnread && 'font-medium'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isGroup ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        )}
      >
        {isGroup ? <UsersIcon /> : <UserIcon />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 truncate">
            <span className="truncate text-sm font-medium">{displayName}</span>
            {conversation.isArchived && (
              <span className="text-muted-foreground">
                <ArchiveIcon />
              </span>
            )}
          </div>
          {formattedTime && (
            <span
              className={cn(
                'shrink-0 text-xs',
                hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'truncate text-sm',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {conversation.lastMessagePreview || 'Nenhuma mensagem'}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
