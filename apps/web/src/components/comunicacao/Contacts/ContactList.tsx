'use client';

/**
 * ContactList Component
 * Lista de contatos com busca e filtros
 * SRP: Orquestra a lista de contatos, delegando UI para subcomponentes
 */

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ContactItem } from './ContactItem';
import type { Contact } from '../../../services/comunicacao/types';

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

const PlusIcon = () => (
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
    <path d="M5 12h14" />
    <path d="M12 5v14" />
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
    className="h-12 w-12 text-muted-foreground"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

type FilterType = 'all' | 'favorites' | 'blocked';

export interface ContactListProps {
  contacts: Contact[];
  selectedContactId?: string;
  isLoading?: boolean;
  onSelectContact?: (contact: Contact) => void;
  onStartChat?: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
  onToggleBlock?: (contact: Contact) => void;
  onAddContact?: () => void;
  className?: string;
}

export function ContactList({
  contacts,
  selectedContactId,
  isLoading = false,
  onSelectContact,
  onStartChat,
  onToggleFavorite,
  onToggleBlock,
  onAddContact,
  className,
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Apply filter
    switch (filter) {
      case 'favorites':
        result = result.filter((c) => c.isFavorite);
        break;
      case 'blocked':
        result = result.filter((c) => c.isBlocked);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phoneNumber.includes(query)
      );
    }

    // Sort: favorites first, then alphabetically
    result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [contacts, filter, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'Todos' },
    { type: 'favorites', label: 'Favoritos' },
    { type: 'blocked', label: 'Bloqueados' },
  ];

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contatos</h2>
          <Button size="sm" onClick={onAddContact}>
            <PlusIcon />
            <span className="ml-2">Adicionar</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <SearchIcon />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filterButtons.map(({ type, label }) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <UserIcon />
            <p className="mt-4 font-medium">
              {searchQuery
                ? 'Nenhum contato encontrado'
                : filter === 'favorites'
                  ? 'Nenhum favorito'
                  : filter === 'blocked'
                    ? 'Nenhum bloqueado'
                    : 'Nenhum contato'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? 'Tente uma busca diferente'
                : 'Adicione contatos para iniciar conversas'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Button className="mt-4" onClick={onAddContact}>
                <PlusIcon />
                <span className="ml-2">Adicionar contato</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={contact.id === selectedContactId}
                onSelect={onSelectContact}
                onStartChat={onStartChat}
                onToggleFavorite={onToggleFavorite}
                onToggleBlock={onToggleBlock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {!isLoading && contacts.length > 0 && (
        <div className="border-t p-3 text-center text-sm text-muted-foreground">
          {filteredContacts.length} de {contacts.length} contatos
        </div>
      )}
    </div>
  );
}
