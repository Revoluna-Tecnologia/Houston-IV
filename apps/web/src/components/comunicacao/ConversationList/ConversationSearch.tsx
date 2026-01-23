'use client';

/**
 * ConversationSearch Component
 * Campo de busca para filtrar conversas
 * SRP: Responsavel apenas pela UI de busca
 */

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
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

export interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function ConversationSearch({
  value,
  onChange,
  placeholder = 'Buscar conversas...',
  className,
  autoFocus = false,
}: ConversationSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-background px-3 transition-colors',
          isFocused && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <SearchIcon />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <XIcon />
            <span className="sr-only">Limpar busca</span>
          </Button>
        )}
      </div>
    </div>
  );
}
