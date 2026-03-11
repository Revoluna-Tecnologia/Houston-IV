'use client';

/**
 * useContacts Hook
 * Gerencia lista de contatos salvos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { contactsService } from '../../services/comunicacao/contacts-service';
import type {
  Contact,
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
} from '../../services/comunicacao/types';

export interface UseContactsOptions {
  filters?: ContactQueryDto;
  autoFetch?: boolean;
}

export interface UseContactsReturn {
  contacts: Contact[];
  favorites: Contact[];
  blocked: Contact[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: CreateContactDto) => Promise<Contact>;
  update: (id: string, data: UpdateContactDto) => Promise<Contact>;
  delete: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleBlock: (id: string) => Promise<void>;
}

export function useContacts(options: UseContactsOptions = {}): UseContactsReturn {
  const { filters, autoFetch = true } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contactsService.getAll(filters);
      setContacts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchContacts();
    }
  }, [autoFetch, fetchContacts]);

  const create = useCallback(async (data: CreateContactDto): Promise<Contact> => {
    const contact = await contactsService.create(data);
    setContacts((prev) => [...prev, contact].sort((a, b) => a.name.localeCompare(b.name)));
    return contact;
  }, []);

  const update = useCallback(async (id: string, data: UpdateContactDto): Promise<Contact> => {
    const updated = await contactsService.update(id, data);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return updated;
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    await contactsService.delete(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const updated = await contactsService.toggleFavorite(id);
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const toggleBlock = useCallback(async (id: string): Promise<void> => {
    const updated = await contactsService.toggleBlock(id);
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const favorites = useMemo(() => contacts.filter((c) => c.isFavorite), [contacts]);
  const blocked = useMemo(() => contacts.filter((c) => c.isBlocked), [contacts]);

  return {
    contacts,
    favorites,
    blocked,
    isLoading,
    error,
    refetch: fetchContacts,
    create,
    update,
    delete: deleteContact,
    toggleFavorite,
    toggleBlock,
  };
}
