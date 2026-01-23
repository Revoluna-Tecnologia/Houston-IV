import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ProtectedRoute } from '../protected-route';
import { resetAuthMocks, setAuthenticatedSession, setLoadingSession } from '../../../__tests__/mocks/auth-client';

// Mock Better Auth client - must be hoisted
vi.mock('../../../lib/auth-client', async () => {
  const { mockAuthClient } = await import('../../../__tests__/mocks/auth-client');
  return {
    authClient: mockAuthClient,
    signIn: mockAuthClient.signIn,
    signUp: mockAuthClient.signUp,
    signOut: mockAuthClient.signOut,
    useSession: mockAuthClient.useSession,
    getSession: mockAuthClient.getSession,
  };
});

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    resetAuthMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while checking auth', async () => {
      setLoadingSession();

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/carregando/i)).toBeInTheDocument();
      });
    });

    it('does not render children while loading', async () => {
      setLoadingSession();

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      // Content should not be visible when loading
      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('authenticated state', () => {
    it('renders children when authenticated', async () => {
      setAuthenticatedSession();

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('does not redirect when authenticated', async () => {
      setAuthenticatedSession();

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated state', () => {
    it('redirects to login when not authenticated', async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('does not render children when not authenticated', async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('returns null after redirect', async () => {
      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        { wrapper }
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(container.querySelector('.min-h-screen')).toBeNull();
      });
    });
  });
});
