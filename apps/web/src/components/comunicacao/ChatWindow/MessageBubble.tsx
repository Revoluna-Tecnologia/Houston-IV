'use client';

/**
 * MessageBubble Component
 * Renderiza uma bolha de mensagem individual
 * SRP: Responsavel apenas pela UI de uma mensagem
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Message, MessageType, MessageStatus } from '../../../services/comunicacao/types';

const CheckIcon = () => (
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CheckCheckIcon = () => (
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
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
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
    className="h-3 w-3"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3 w-3 text-destructive"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showSender = false,
  onReply,
  onDelete,
  className,
}: MessageBubbleProps) {
  const formattedTime = useMemo(() => {
    try {
      return format(new Date(message.createdAt), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  const isDeleted = !!message.deletedAt;
  const isOptimistic = 'isOptimistic' in message;

  return (
    <div
      className={cn(
        'group flex',
        isOwn ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md',
          isDeleted && 'italic opacity-60',
          isOptimistic && 'opacity-70'
        )}
      >
        {/* Sender name for group chats */}
        {showSender && !isOwn && message.sender && (
          <p className="mb-1 text-xs font-medium text-primary">
            {message.sender.name}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'mb-2 rounded border-l-2 py-1 pl-2 text-xs',
              isOwn
                ? 'border-primary-foreground/50 bg-primary-foreground/10'
                : 'border-primary bg-primary/10'
            )}
          >
            <p className="truncate opacity-80">{message.replyTo.content}</p>
          </div>
        )}

        {/* Content */}
        <MessageContent message={message} isDeleted={isDeleted} />

        {/* Footer */}
        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span className="text-[10px]">{formattedTime}</span>
          {isOwn && <StatusIndicator status={message.status} />}
        </div>
      </div>

      {/* Context menu (hover) */}
      {!isDeleted && (onReply || onDelete) && (
        <div className="mx-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="rounded p-1 hover:bg-muted"
              title="Responder"
            >
              <ReplyIcon />
            </button>
          )}
          {onDelete && isOwn && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="rounded p-1 hover:bg-muted"
              title="Excluir"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MessageContent({
  message,
  isDeleted,
}: {
  message: Message;
  isDeleted: boolean;
}) {
  if (isDeleted) {
    return <p className="text-sm">Mensagem excluida</p>;
  }

  switch (message.messageType as MessageType) {
    case 'image':
      return (
        <div className="space-y-1">
          {message.metadata?.mediaUrl && (
            <img
              src={message.metadata.mediaUrl}
              alt={message.metadata.caption || 'Imagem'}
              className="max-h-60 rounded-lg object-cover"
            />
          )}
          {message.metadata?.caption && (
            <p className="text-sm">{message.metadata.caption}</p>
          )}
        </div>
      );

    case 'audio':
      return (
        <audio
          src={message.metadata?.mediaUrl}
          controls
          className="max-w-full"
        />
      );

    case 'video':
      return (
        <video
          src={message.metadata?.mediaUrl}
          controls
          className="max-h-60 rounded-lg"
        />
      );

    case 'file':
      return (
        <a
          href={message.metadata?.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded bg-background/10 p-2 hover:bg-background/20"
        >
          <FileIcon />
          <span className="truncate text-sm">
            {message.metadata?.fileName || 'Arquivo'}
          </span>
        </a>
      );

    case 'shift_offer':
      return (
        <div className="rounded-lg bg-background/10 p-3">
          <p className="text-xs font-medium uppercase opacity-70">
            Oferta de Plantao
          </p>
          <p className="mt-1 text-sm">{message.content}</p>
        </div>
      );

    case 'text':
    default:
      return <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>;
  }
}

function StatusIndicator({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sending':
      return <ClockIcon />;
    case 'sent':
      return <CheckIcon />;
    case 'delivered':
      return <CheckCheckIcon />;
    case 'read':
      return <span className="text-blue-400"><CheckCheckIcon /></span>;
    case 'failed':
      return <AlertCircleIcon />;
    default:
      return null;
  }
}

const ReplyIcon = () => (
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
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const TrashIcon = () => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const FileIcon = () => (
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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
