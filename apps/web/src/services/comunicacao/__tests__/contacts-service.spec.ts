import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server';
import { contactsService } from '../contacts-service';
import { mockContacts } from './mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('ContactsService', () => {
  describe('getAll', () => {
    it('fetches all contacts successfully', async () => {
      const response = await contactsService.getAll();

      expect(response.data).toHaveLength(mockContacts.length);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page');
    });

    it('fetches contacts with search filter', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/contacts`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockContacts.filter((c) =>
              c.name.toLowerCase().includes('joao')
            ),
            meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await contactsService.getAll({ search: 'joao' });

      expect(capturedUrl).toContain('search=joao');
    });

    it('fetches only favorite contacts', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/contacts`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockContacts.filter((c) => c.isFavorite),
            meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await contactsService.getAll({ isFavorite: true });

      expect(capturedUrl).toContain('isFavorite=true');
    });

    it('fetches only blocked contacts', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/contacts`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockContacts.filter((c) => c.isBlocked),
            meta: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      await contactsService.getAll({ isBlocked: true });

      expect(capturedUrl).toContain('isBlocked=true');
    });

    it('handles empty response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/contacts`, () => {
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
          });
        })
      );

      const response = await contactsService.getAll();

      expect(response.data).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('fetches contact by id successfully', async () => {
      const contact = await contactsService.getById('contact-1');

      expect(contact.id).toBe('contact-1');
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('phoneNumber');
    });

    it('throws error for non-existent contact', async () => {
      await expect(contactsService.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates contact successfully', async () => {
      const contactData = {
        name: 'Dr. Novo Contato',
        phoneNumber: '5511777777777',
      };

      const contact = await contactsService.create(contactData);

      expect(contact).toHaveProperty('id');
      expect(contact.name).toBe('Dr. Novo Contato');
      expect(contact.phoneNumber).toBe('5511777777777');
      expect(contact.isFavorite).toBe(false);
      expect(contact.isBlocked).toBe(false);
    });

    it('creates contact linked to medico', async () => {
      server.use(
        http.post(`${API_BASE_URL}/contacts`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'contact-new',
            grupoId: 'grupo-1',
            phoneNumber: body.phoneNumber,
            name: body.name,
            medicoId: body.medicoId,
            isFavorite: false,
            isBlocked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const contactData = {
        name: 'Dr. Com Medico',
        phoneNumber: '5511666666666',
        medicoId: 'medico-2',
      };

      const contact = await contactsService.create(contactData);

      expect(contact.medicoId).toBe('medico-2');
    });
  });

  describe('update', () => {
    it('updates contact name successfully', async () => {
      const contact = await contactsService.update('contact-1', { name: 'Novo Nome' });

      expect(contact.id).toBe('contact-1');
      expect(contact.name).toBe('Novo Nome');
    });

    it('toggles favorite status', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/contacts/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          const contact = mockContacts.find((c) => c.id === params.id);
          return HttpResponse.json({ ...contact, ...body, updatedAt: new Date().toISOString() });
        })
      );

      const contact = await contactsService.update('contact-1', { isFavorite: false });

      expect(contact.isFavorite).toBe(false);
    });

    it('toggles blocked status', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/contacts/:id`, async ({ params, request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          const contact = mockContacts.find((c) => c.id === params.id);
          return HttpResponse.json({ ...contact, ...body, updatedAt: new Date().toISOString() });
        })
      );

      const contact = await contactsService.update('contact-2', { isBlocked: true });

      expect(contact.isBlocked).toBe(true);
    });

    it('throws error for non-existent contact', async () => {
      await expect(contactsService.update('non-existent', { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes contact successfully', async () => {
      await expect(contactsService.delete('contact-1')).resolves.not.toThrow();
    });

    it('throws error for non-existent contact', async () => {
      await expect(contactsService.delete('non-existent')).rejects.toThrow();
    });
  });
});
