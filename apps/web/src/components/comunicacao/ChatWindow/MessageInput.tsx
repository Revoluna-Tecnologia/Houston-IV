'use client';

/**
 * MessageInput Component
 * Campo de entrada de mensagem com suporte a arquivos e audio
 * SRP: Responsavel pela UI e logica de entrada de mensagem
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Message } from '../../../services/comunicacao/types';

const SendIcon = () => (
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
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const PaperclipIcon = () => (
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
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const MicIcon = () => (
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
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const XIcon = () => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onFileSelect?: (file: File) => void;
  onAudioRecord?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  onFileSelect,
  onAudioRecord,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Digite uma mensagem...',
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);

      // Typing indicator
      if (value.length > 0) {
        onTyping?.();

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          onStopTyping?.();
        }, 2000);
      } else {
        onStopTyping?.();
      }
    },
    [onTyping, onStopTyping]
  );

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
    onStopTyping?.();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend, onStopTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileSelect) {
        onFileSelect(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileSelect]
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const hasContent = message.trim().length > 0;

  return (
    <div className={cn('border-t bg-background', className)}>
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
          <div className="flex-1 truncate">
            <p className="text-xs font-medium text-primary">
              Respondendo a {replyTo.sender?.name || 'mensagem'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {replyTo.content}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-6 w-6"
          >
            <XIcon />
            <span className="sr-only">Cancelar resposta</span>
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* File button */}
        {onFileSelect && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileClick}
              disabled={disabled}
              className="shrink-0"
            >
              <PaperclipIcon />
              <span className="sr-only">Anexar arquivo</span>
            </Button>
          </>
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[40px] max-h-[150px] resize-none"
        />

        {/* Send/Mic button */}
        {hasContent ? (
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={disabled}
            className="shrink-0"
          >
            <SendIcon />
            <span className="sr-only">Enviar</span>
          </Button>
        ) : onAudioRecord ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAudioRecord}
            disabled={disabled}
            className="shrink-0"
          >
            <MicIcon />
            <span className="sr-only">Gravar audio</span>
          </Button>
        ) : (
          <Button type="button" size="icon" disabled className="shrink-0">
            <SendIcon />
            <span className="sr-only">Enviar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
