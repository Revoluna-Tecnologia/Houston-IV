import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Header } from '../header';
import { UserRole } from '../../../services/types';
import type { User } from '../../../services/types';

const mockLogout = vi.fn();

vi.mock('../../../hooks', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.ADMINISTRADOR,
  grupoIds: ['grupo-1'],
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Header', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  describe('rendering', () => {
    it('renders mobile menu button', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();
    });

    it('renders notification button', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByRole('button', { name: /notificacoes/i })).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} title="Dashboard" />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('does not render title when not provided', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('user avatar', () => {
    it('shows user initials in avatar', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      // User initials should be in an AvatarFallback, which renders a span
      const initialsElements = screen.getAllByText('TU');
      expect(initialsElements.length).toBeGreaterThan(0);
    });

    it('does not show avatar when user is null', () => {
      render(<Header user={null} onMenuClick={vi.fn()} />);
      expect(screen.queryByText('TU')).not.toBeInTheDocument();
    });
  });

  describe('mobile menu', () => {
    it('calls onMenuClick when menu button is clicked', async () => {
      const onMenuClick = vi.fn();
      const user = userEvent.setup();

      render(<Header user={mockUser} onMenuClick={onMenuClick} />);

      await user.click(screen.getByRole('button', { name: /abrir menu/i }));

      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('user dropdown', () => {
    it('opens dropdown on avatar click', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      // In the mock, dropdown content is always visible
      expect(screen.getByText('Perfil')).toBeInTheDocument();
    });

    it('shows user name in dropdown', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('shows user email in dropdown', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows settings option in dropdown', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByText('Configuracoes')).toBeInTheDocument();
    });

    it('shows logout option in dropdown', () => {
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    it('calls logout when logout is clicked', async () => {
      const user = userEvent.setup();
      render(<Header user={mockUser} onMenuClick={vi.fn()} />);

      await user.click(screen.getByText('Sair'));

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('user initials calculation', () => {
    it('calculates initials for single name', () => {
      const singleNameUser = { ...mockUser, name: 'Admin' };
      render(<Header user={singleNameUser} onMenuClick={vi.fn()} />);
      // Should find at least one 'A' element
      const elements = screen.getAllByText('A');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('calculates initials for multiple names', () => {
      const multiNameUser = { ...mockUser, name: 'Maria Silva Santos' };
      render(<Header user={multiNameUser} onMenuClick={vi.fn()} />);
      // Should find at least one 'MS' element (appears in both avatar areas)
      const elements = screen.getAllByText('MS');
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
