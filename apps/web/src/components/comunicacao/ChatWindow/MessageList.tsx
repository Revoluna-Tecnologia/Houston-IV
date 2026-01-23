'use client';

/**
 * MessageList Component
 * Lista de mensagens com scroll infinito e agrupamento por data
 * SRP: Orquestra a lista de mensagens, delegando renderizacao para MessageBubble
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageBubble } from './MessageBubble';
import type { Message, OptimisticMessage } from '../../../services/comunicacao/types';

export interface MessageListProps {
  messages: (Message | OptimisticMessage)[];
  currentUserId?: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: Message) => void;
  onDelete?: (id: string) => void;
  showSenderNames?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId = '',
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onDelete,
  showSenderNames = false,
  className,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Track if user is at bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

    // Load more when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: (Message | OptimisticMessage)[] }[] = [];
    let currentGroup: { date: Date; messages: (Message | OptimisticMessage)[] } | null = null;

    for (const message of messages) {
      const messageDate = new Date(message.createdAt);

      if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    }

    return groups;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('flex flex-1 flex-col overflow-y-auto', className)}
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-4">
          {isLoading ? (
            <MessageListSkeleton count={3} />
          ) : (
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Carregar mensagens anteriores
            </Button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Comece a conversa!
          </p>
        </div>
      )}

      {/* Messages grouped by date */}
      <div className="flex flex-col gap-2 px-4 py-2">
        {groupedMessages.map((group) => (
          <div key={group.date.toISOString()}>
            {/* Date separator */}
            <DateSeparator date={group.date} />

            {/* Messages */}
            <div className="space-y-1">
              {group.messages.map((message, index) => {
                const isOwn = message.senderId === currentUserId;
                const prevMessage = index > 0 ? group.messages[index - 1] : null;
                const showSender =
                  showSenderNames &&
                  !isOwn &&
                  (!prevMessage || prevMessage.senderId !== message.senderId);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message as Message}
                    isOwn={isOwn}
                    showSender={showSender}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

function DateSeparator({ date }: { date: Date }) {
  const label = useMemo(() => {
    if (isToday(date)) {
      return 'Hoje';
    }
    if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  }, [date]);

  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex',
            i % 2 === 0 ? 'justify-start' : 'justify-end'
          )}
        >
          <Skeleton
            className={cn(
              'h-12 rounded-2xl',
              i % 2 === 0 ? 'w-2/3' : 'w-1/2'
            )}
          />
        </div>
      ))}
    </div>
  );
}
