import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/mocks/server';
import { vagasService } from '../vagas-service';
import { mockVagas } from '../../__tests__/mocks/handlers';
import type { VagaStatus } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

describe('VagasService', () => {

  describe('getAll', () => {
    it('fetches all vagas successfully', async () => {
      const response = await vagasService.getAll();

      expect(response.data).toHaveLength(mockVagas.length);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page');
      expect(response.meta).toHaveProperty('limit');
    });

    it('fetches vagas with pagination params', async () => {
      const response = await vagasService.getAll({ page: 2, limit: 5 });

      expect(response.meta.page).toBe(2);
      expect(response.meta.limit).toBe(5);
    });

    it('fetches vagas with sorting params', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/vagas`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockVagas,
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
          });
        })
      );

      await vagasService.getAll({ sortBy: 'data', sortOrder: 'desc' });

      expect(capturedUrl).toContain('sortBy=data');
      expect(capturedUrl).toContain('sortOrder=desc');
    });

    it('handles empty response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vagas`, () => {
          return HttpResponse.json({
            data: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
          });
        })
      );

      const response = await vagasService.getAll();

      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('fetches vaga by id successfully', async () => {
      const vaga = await vagasService.getById('vaga-1');

      expect(vaga.id).toBe('vaga-1');
      expect(vaga).toHaveProperty('data');
      expect(vaga).toHaveProperty('valor');
    });

    it('throws error for non-existent vaga', async () => {
      await expect(vagasService.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates vaga successfully', async () => {
      const vagaData = {
        data: '2025-01-20',
        horaInicio: '08:00',
        horaFim: '18:00',
        valor: 1800,
        hospitalId: 'hospital-1',
        setorId: 'setor-1',
        especialidadeId: 'especialidade-1',
      };

      const vaga = await vagasService.create(vagaData);

      expect(vaga).toHaveProperty('id');
      expect(vaga.valor).toBe(1800);
    });

    it('creates vaga with observacoes', async () => {
      const vagaData = {
        data: '2025-01-20',
        horaInicio: '08:00',
        horaFim: '18:00',
        valor: 1800,
        hospitalId: 'hospital-1',
        setorId: 'setor-1',
        especialidadeId: 'especialidade-1',
        observacoes: 'Plantao especial',
      };

      const vaga = await vagasService.create(vagaData);

      expect(vaga.observacoes).toBe('Plantao especial');
    });

    it('returns created vaga with status aberta', async () => {
      const vagaData = {
        data: '2025-01-20',
        horaInicio: '08:00',
        horaFim: '18:00',
        valor: 1800,
        hospitalId: 'hospital-1',
        setorId: 'setor-1',
        especialidadeId: 'especialidade-1',
      };

      const vaga = await vagasService.create(vagaData);

      expect(vaga.status).toBe('aberta');
    });
  });

  describe('update', () => {
    it('updates vaga successfully', async () => {
      const updateData = { valor: 2500 };
      const vaga = await vagasService.update('vaga-1', updateData);

      expect(vaga.id).toBe('vaga-1');
    });

    it('updates multiple fields', async () => {
      const updateData = {
        valor: 3000,
        observacoes: 'Atualizado',
        horaInicio: '09:00',
      };

      server.use(
        http.put(`${API_BASE_URL}/vagas/vaga-1`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            ...mockVagas[0],
            ...(body as Record<string, unknown>),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      const vaga = await vagasService.update('vaga-1', updateData);

      expect(vaga.valor).toBe(3000);
      expect(vaga.observacoes).toBe('Atualizado');
    });

    it('throws error for non-existent vaga', async () => {
      await expect(
        vagasService.update('non-existent', { valor: 1000 })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes vaga successfully', async () => {
      await expect(vagasService.delete('vaga-1')).resolves.toBeUndefined();
    });

    it('throws error for non-existent vaga', async () => {
      await expect(vagasService.delete('non-existent')).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('updates vaga status to fechada', async () => {
      const vaga = await vagasService.updateStatus('vaga-1', 'fechada' as VagaStatus);

      expect(vaga.status).toBe('fechada');
    });

    it('updates vaga status to cancelada', async () => {
      const vaga = await vagasService.updateStatus('vaga-1', 'cancelada' as VagaStatus);

      expect(vaga.status).toBe('cancelada');
    });

    it('updates vaga status to anunciada', async () => {
      const vaga = await vagasService.updateStatus('vaga-1', 'anunciada' as VagaStatus);

      expect(vaga.status).toBe('anunciada');
    });

    it('throws error for non-existent vaga', async () => {
      await expect(
        vagasService.updateStatus('non-existent', 'fechada' as VagaStatus)
      ).rejects.toThrow();
    });
  });

  describe('createBulk', () => {
    it('creates multiple vagas successfully', async () => {
      const vagasData = [
        {
          data: '2025-01-20',
          horaInicio: '08:00',
          horaFim: '18:00',
          valor: 1500,
          hospitalId: 'hospital-1',
          setorId: 'setor-1',
          especialidadeId: 'especialidade-1',
        },
        {
          data: '2025-01-21',
          horaInicio: '18:00',
          horaFim: '08:00',
          valor: 2000,
          hospitalId: 'hospital-1',
          setorId: 'setor-1',
          especialidadeId: 'especialidade-1',
        },
      ];

      const vagas = await vagasService.createBulk(vagasData);

      expect(vagas).toHaveLength(2);
      expect(vagas[0]).toHaveProperty('id');
      expect(vagas[1]).toHaveProperty('id');
    });

    it('creates all vagas with aberta status', async () => {
      const vagasData = [
        {
          data: '2025-01-20',
          horaInicio: '08:00',
          horaFim: '18:00',
          valor: 1500,
          hospitalId: 'hospital-1',
          setorId: 'setor-1',
          especialidadeId: 'especialidade-1',
        },
      ];

      const vagas = await vagasService.createBulk(vagasData);

      expect(vagas[0].status).toBe('aberta');
    });
  });
});
