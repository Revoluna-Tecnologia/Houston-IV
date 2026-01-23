import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Sidebar } from '../sidebar';

import { UserRole } from '../../../services/types';
import type { User } from '../../../services/types';

const mockLogout = vi.fn();
const mockPathname = vi.fn().mockReturnValue('/');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname(),
}));

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

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockAdminUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: UserRole.ADMINISTRADOR,
  grupoIds: ['grupo-1'],
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRegularUser: User = {
  id: 'user-2',
  email: 'user@example.com',
  name: 'Regular User',
  role: UserRole.ESCALISTA,
  grupoIds: ['grupo-1'],
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Sidebar', () => {
  beforeEach(() => {
    mockLogout.mockClear();
    mockPathname.mockReturnValue('/');
  });

  describe('rendering', () => {
    it('renders Houston IV logo', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Houston IV')).toBeInTheDocument();
    });

    it('renders dashboard navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders vagas navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Vagas')).toBeInTheDocument();
    });

    it('renders candidaturas navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Candidaturas')).toBeInTheDocument();
    });

    it('renders medicos navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Medicos')).toBeInTheDocument();
    });

    it('renders hospitais navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Hospitais')).toBeInTheDocument();
    });

    it('renders grades navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Grades')).toBeInTheDocument();
    });

    it('renders pagamentos navigation link', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    });
  });

  describe('user info', () => {
    it('displays user name', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    it('displays user initials', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('AU')).toBeInTheDocument();
    });

    it('does not show user section when user is null', () => {
      render(<Sidebar user={null} />);
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    });
  });

  describe('admin only links', () => {
    it('shows usuarios link for admin', () => {
      render(<Sidebar user={mockAdminUser} />);
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('hides usuarios link for non-admin', () => {
      render(<Sidebar user={mockRegularUser} />);
      expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('highlights dashboard when on home route', () => {
      mockPathname.mockReturnValue('/');
      render(<Sidebar user={mockAdminUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-primary-50');
    });

    it('highlights vagas when on vagas route', () => {
      mockPathname.mockReturnValue('/vagas');
      render(<Sidebar user={mockAdminUser} />);

      const vagasLink = screen.getByText('Vagas').closest('a');
      expect(vagasLink).toHaveClass('bg-primary-50');
    });

    it('highlights route for nested paths', () => {
      mockPathname.mockReturnValue('/vagas/123');
      render(<Sidebar user={mockAdminUser} />);

      const vagasLink = screen.getByText('Vagas').closest('a');
      expect(vagasLink).toHaveClass('bg-primary-50');
    });
  });

  describe('logout', () => {
    it('calls logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar user={mockAdminUser} />);

      const logoutButton = screen.getByRole('button');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('link hrefs', () => {
    it('dashboard link has correct href', () => {
      render(<Sidebar user={mockAdminUser} />);
      const link = screen.getByText('Dashboard').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });

    it('vagas link has correct href', () => {
      render(<Sidebar user={mockAdminUser} />);
      const link = screen.getByText('Vagas').closest('a');
      expect(link).toHaveAttribute('href', '/vagas');
    });

    it('hospitais link has correct href', () => {
      render(<Sidebar user={mockAdminUser} />);
      const link = screen.getByText('Hospitais').closest('a');
      expect(link).toHaveAttribute('href', '/hospitais');
    });
  });
});
