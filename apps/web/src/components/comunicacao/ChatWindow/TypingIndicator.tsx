'use client';

/**
 * TypingIndicator Component
 * Mostra quem esta digitando
 * SRP: Responsavel apenas pela UI do indicador de digitacao
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TypingState } from '../../../services/comunicacao/types';

export interface TypingIndicatorProps {
  conversationId: string;
  typingUsers: TypingState;
  className?: string;
}

export function TypingIndicator({
  conversationId,
  typingUsers,
  className,
}: TypingIndicatorProps) {
  const users = typingUsers[conversationId] || [];

  const text = useMemo(() => {
    if (users.length === 0) return null;

    if (users.length === 1) {
      return `${users[0].userName} esta digitando...`;
    }

    if (users.length === 2) {
      return `${users[0].userName} e ${users[1].userName} estao digitando...`;
    }

    return `${users[0].userName} e mais ${users.length - 1} estao digitando...`;
  }, [users]);

  if (!text) return null;

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <TypingDots />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  );
}
