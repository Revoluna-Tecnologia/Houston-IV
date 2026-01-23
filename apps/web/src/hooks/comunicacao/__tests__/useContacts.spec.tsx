import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useContacts } from '../useContacts';
import { contactsService } from '../../../services/comunicacao/contacts-service';
import type { Contact, PaginatedResponse } from '../../../services/comunicacao/types';

// Mock services
vi.mock('../../../services/comunicacao/contacts-service', () => ({
  contactsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleFavorite: vi.fn(),
    toggleBlock: vi.fn(),
    getByPhone: vi.fn(),
    importFromMedicos: vi.fn(),
  },
}));

const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Alice',
    phoneNumber: '5511999999999',
    grupoId: 'grupo-1',
    isFavorite: true,
    isBlocked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'contact-2',
    name: 'Bob',
    phoneNumber: '5511888888888',
    grupoId: 'grupo-1',
    isFavorite: false,
    isBlocked: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'contact-3',
    name: 'Charlie',
    phoneNumber: '5511777777777',
    grupoId: 'grupo-1',
    isFavorite: false,
    isBlocked: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const mockResponse: PaginatedResponse<Contact> = {
  data: mockContacts,
  meta: {
    total: 3,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('useContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contactsService.getAll).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useContacts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.contacts).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('fetches contacts on mount when autoFetch is true', async () => {
      const { result } = renderHook(() => useContacts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(contactsService.getAll).toHaveBeenCalledTimes(1);
      expect(result.current.contacts).toHaveLength(3);
    });

    it('does not fetch contacts when autoFetch is false', () => {
      renderHook(() => useContacts({ autoFetch: false }));

      expect(contactsService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('fetching contacts', () => {
    it('fetches contacts successfully', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.contacts).toEqual(mockContacts);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(contactsService.getAll).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.contacts).toEqual([]);
    });

    it('passes filters to service', async () => {
      const filters = { search: 'alice', isFavorite: true };

      const { result } = renderHook(() => useContacts({ filters }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(contactsService.getAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('computed lists', () => {
    it('returns favorites list', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].id).toBe('contact-1');
    });

    it('returns blocked list', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blocked).toHaveLength(1);
      expect(result.current.blocked[0].id).toBe('contact-3');
    });
  });

  describe('create', () => {
    it('creates new contact and adds to list sorted', async () => {
      const newContact: Contact = {
        id: 'contact-4',
        name: 'David',
        phoneNumber: '5511666666666',
        grupoId: 'grupo-1',
        isFavorite: false,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(contactsService.create).mockResolvedValueOnce(newContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: Contact | undefined;
      await act(async () => {
        created = await result.current.create({
          name: 'David',
          phoneNumber: '5511666666666',
        });
      });

      expect(created).toEqual(newContact);
      expect(result.current.contacts).toContainEqual(newContact);
      // Check alphabetical sorting
      const names = result.current.contacts.map((c) => c.name);
      expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
    });
  });

  describe('update', () => {
    it('updates contact and maintains sort', async () => {
      const updatedContact: Contact = {
        ...mockContacts[1],
        name: 'Bobby',
      };

      vi.mocked(contactsService.update).mockResolvedValueOnce(updatedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.update('contact-2', { name: 'Bobby' });
      });

      expect(contactsService.update).toHaveBeenCalledWith('contact-2', { name: 'Bobby' });
      expect(result.current.contacts.find((c) => c.id === 'contact-2')?.name).toBe('Bobby');
    });
  });

  describe('delete', () => {
    it('deletes contact and removes from list', async () => {
      vi.mocked(contactsService.delete).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.contacts).toHaveLength(3);

      await act(async () => {
        await result.current.delete('contact-2');
      });

      expect(contactsService.delete).toHaveBeenCalledWith('contact-2');
      expect(result.current.contacts).toHaveLength(2);
      expect(result.current.contacts.find((c) => c.id === 'contact-2')).toBeUndefined();
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite status', async () => {
      const updatedContact: Contact = {
        ...mockContacts[1],
        isFavorite: true,
      };

      vi.mocked(contactsService.toggleFavorite).mockResolvedValueOnce(updatedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.contacts.find((c) => c.id === 'contact-2')?.isFavorite).toBe(false);

      await act(async () => {
        await result.current.toggleFavorite('contact-2');
      });

      expect(contactsService.toggleFavorite).toHaveBeenCalledWith('contact-2', true);
      expect(result.current.contacts.find((c) => c.id === 'contact-2')?.isFavorite).toBe(true);
      expect(result.current.favorites).toHaveLength(2);
    });
  });

  describe('toggleBlock', () => {
    it('toggles block status', async () => {
      const updatedContact: Contact = {
        ...mockContacts[1],
        isBlocked: true,
      };

      vi.mocked(contactsService.toggleBlock).mockResolvedValueOnce(updatedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.contacts.find((c) => c.id === 'contact-2')?.isBlocked).toBe(false);

      await act(async () => {
        await result.current.toggleBlock('contact-2');
      });

      expect(contactsService.toggleBlock).toHaveBeenCalledWith('contact-2', true);
      expect(result.current.contacts.find((c) => c.id === 'contact-2')?.isBlocked).toBe(true);
      expect(result.current.blocked).toHaveLength(2);
    });
  });

  describe('getByPhone', () => {
    it('gets contact by phone number', async () => {
      vi.mocked(contactsService.getByPhone).mockResolvedValueOnce(mockContacts[0]);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.getByPhone('5511999999999');
      });

      expect(contactsService.getByPhone).toHaveBeenCalledWith('5511999999999');
      expect(contact).toEqual(mockContacts[0]);
    });

    it('returns null for non-existent phone', async () => {
      vi.mocked(contactsService.getByPhone).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.getByPhone('5511000000000');
      });

      expect(contact).toBeNull();
    });
  });

  describe('importFromMedicos', () => {
    it('imports contacts from medicos and refetches', async () => {
      vi.mocked(contactsService.importFromMedicos).mockResolvedValueOnce({ imported: 5 });

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(contactsService.getAll).toHaveBeenCalledTimes(1);

      let importedCount: number | undefined;
      await act(async () => {
        importedCount = await result.current.importFromMedicos();
      });

      expect(importedCount).toBe(5);
      expect(contactsService.importFromMedicos).toHaveBeenCalled();
      expect(contactsService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('refetch', () => {
    it('refetches contacts', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(contactsService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(contactsService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
