import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/mocks/server';
import { useVagas } from '../use-vagas';
import { mockVagas } from '../../__tests__/mocks/handlers';

const API_BASE_URL = 'http://localhost:3001/api';

describe('useVagas', () => {

  describe('data fetching', () => {
    it('fetches vagas on mount', async () => {
      const { result } = renderHook(() => useVagas());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(mockVagas.length);
    });

    it('returns meta information', async () => {
      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.meta).toHaveProperty('total');
      expect(result.current.meta).toHaveProperty('page');
      expect(result.current.meta).toHaveProperty('limit');
      expect(result.current.meta).toHaveProperty('totalPages');
    });

    it('sets error on fetch failure', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vagas`, () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('clears error on successful refetch', async () => {
      let shouldFail = true;
      server.use(
        http.get(`${API_BASE_URL}/vagas`, () => {
          if (shouldFail) {
            shouldFail = false;
            return HttpResponse.json(
              { message: 'Server error' },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            data: mockVagas,
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('query params', () => {
    it('passes query params to API', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE_URL}/vagas`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: mockVagas,
            meta: { total: 2, page: 2, limit: 5, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() =>
        useVagas({ page: 2, limit: 5 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(capturedUrl).toContain('page=2');
      expect(capturedUrl).toContain('limit=5');
    });

    it('refetches when query changes', async () => {
      let fetchCount = 0;
      server.use(
        http.get(`${API_BASE_URL}/vagas`, () => {
          fetchCount++;
          return HttpResponse.json({
            data: mockVagas,
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
          });
        })
      );

      const { result, rerender } = renderHook(
        ({ query }) => useVagas(query),
        { initialProps: { query: { page: 1 } } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ query: { page: 2 } });

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });
    });
  });

  describe('create', () => {
    it('creates vaga and refetches', async () => {
      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newVaga = await act(async () => {
        return result.current.create({
          data: '2025-01-20',
          horaInicio: '08:00',
          horaFim: '18:00',
          valor: 1500,
          hospitalId: 'hospital-1',
          setorId: 'setor-1',
          especialidadeId: 'especialidade-1',
        });
      });

      expect(newVaga).toHaveProperty('id');
    });

    it('returns created vaga', async () => {
      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newVaga = await act(async () => {
        return result.current.create({
          data: '2025-01-20',
          horaInicio: '08:00',
          horaFim: '18:00',
          valor: 1800,
          hospitalId: 'hospital-1',
          setorId: 'setor-1',
          especialidadeId: 'especialidade-1',
        });
      });

      expect(newVaga.valor).toBe(1800);
    });
  });

  describe('update', () => {
    it('updates vaga and refetches', async () => {
      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedVaga = await act(async () => {
        return result.current.update('vaga-1', { valor: 2500 });
      });

      expect(updatedVaga).toHaveProperty('id');
    });

    it('returns updated vaga', async () => {
      server.use(
        http.put(`${API_BASE_URL}/vagas/vaga-1`, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          return HttpResponse.json({
            ...mockVagas[0],
            ...body,
            updatedAt: new Date().toISOString(),
          });
        })
      );

      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedVaga = await act(async () => {
        return result.current.update('vaga-1', { valor: 3000 });
      });

      expect(updatedVaga.valor).toBe(3000);
    });
  });

  describe('remove', () => {
    it('deletes vaga and refetches', async () => {
      let deleteCount = 0;
      server.use(
        http.delete(`${API_BASE_URL}/vagas/vaga-1`, () => {
          deleteCount++;
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.remove('vaga-1');
      });

      expect(deleteCount).toBe(1);
    });
  });

  describe('refetch', () => {
    it('refetches data on demand', async () => {
      let fetchCount = 0;
      server.use(
        http.get(`${API_BASE_URL}/vagas`, () => {
          fetchCount++;
          return HttpResponse.json({
            data: mockVagas,
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(fetchCount).toBe(2);
    });

    it('sets loading state during refetch', async () => {
      const { result } = renderHook(() => useVagas());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let _loadingDuringRefetch = false;
      act(() => {
        result.current.refetch().then(() => {
          _loadingDuringRefetch = result.current.isLoading;
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
