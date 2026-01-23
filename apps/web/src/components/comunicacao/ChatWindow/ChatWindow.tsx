'use client';

/**
 * ChatWindow Component
 * Container principal do chat que orquestra header, messages e input
 * SRP: Coordena subcomponentes, delega responsabilidades especificas
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import type {
  Conversation,
  Message,
  OptimisticMessage,
  TypingState,
} from '../../../services/comunicacao/types';

export interface ChatWindowProps {
  conversation: Conversation;
  messages: (Message | OptimisticMessage)[];
  currentUserId?: string;
  isLoading?: boolean;
  isSending?: boolean;
  hasMore?: boolean;
  typingUsers?: TypingState;
  onLoadMore?: () => void;
  onSend?: (content: string) => void;
  onReply?: (content: string, replyToId: string) => void;
  onDelete?: (id: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onFileSelect?: (file: File) => void;
  onAudioRecord?: () => void;
  onArchive?: (archive: boolean) => void;
  onDeleteConversation?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId = '',
  isLoading = false,
  isSending = false,
  hasMore = false,
  typingUsers = {},
  onLoadMore,
  onSend,
  onReply,
  onDelete,
  onTyping,
  onStopTyping,
  onFileSelect,
  onAudioRecord,
  onArchive,
  onDeleteConversation,
  onBack,
  showBackButton = false,
  className,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleReplyClick = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      if (replyTo && onReply) {
        onReply(content, replyTo.id);
        setReplyTo(null);
      } else if (onSend) {
        onSend(content);
      }
    },
    [replyTo, onSend, onReply]
  );

  const isGroup = conversation.type === 'group';

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onArchive={onArchive}
        onDelete={onDeleteConversation}
        showBackButton={showBackButton}
      />

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onReply={handleReplyClick}
        onDelete={onDelete}
        showSenderNames={isGroup}
        className="flex-1"
      />

      {/* Typing indicator */}
      <TypingIndicator
        conversationId={conversation.id}
        typingUsers={typingUsers}
      />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
        onFileSelect={onFileSelect}
        onAudioRecord={onAudioRecord}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        disabled={isSending}
      />
    </div>
  );
}
