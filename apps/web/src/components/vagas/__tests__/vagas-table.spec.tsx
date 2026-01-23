import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { VagasTable, type VagaWithRelations } from '../vagas-table';
import { VagaStatus } from '../../../services/types';
import type { Hospital } from '../../../services/types';

const mockHospitals: Hospital[] = [
  {
    id: 'hospital-1',
    nome: 'Hospital Central',
    grupoId: 'grupo-1',
    cnpj: '12.345.678/0001-90',
    endereco: null,
    cidade: null,
    estado: null,
    cep: null,
    telefone: null,
    email: null,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createMockVaga = (overrides: Partial<VagaWithRelations> = {}): VagaWithRelations => ({
  id: `vaga-${Math.random().toString(36).substr(2, 9)}`,
  data: new Date('2025-01-15T12:00:00'),
  horaInicio: '08:00',
  horaFim: '18:00',
  valor: 1500,
  observacoes: null,
  status: VagaStatus.ABERTA,
  hospitalId: 'hospital-1',
  setorId: 'setor-1',
  especialidadeId: 'especialidade-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  hospitalNome: 'Hospital Central',
  setorNome: 'UTI',
  ...overrides,
});

describe('VagasTable', () => {
  const defaultProps = {
    data: [createMockVaga()],
    hospitals: mockHospitals,
    sorting: null,
    onSort: vi.fn(),
    pageIndex: 0,
    pageSize: 10,
    totalCount: 1,
    onPageChange: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  describe('rendering', () => {
    it('renders table headers', () => {
      render(<VagasTable {...defaultProps} />);

      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Hospital')).toBeInTheDocument();
      expect(screen.getByText('Setor')).toBeInTheDocument();
      expect(screen.getByText('Horario')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Acoes')).toBeInTheDocument();
    });

    it('renders vaga data', () => {
      render(<VagasTable {...defaultProps} />);

      expect(screen.getByText('15/01/2025')).toBeInTheDocument();
      expect(screen.getByText('Hospital Central')).toBeInTheDocument();
      expect(screen.getByText('UTI')).toBeInTheDocument();
      expect(screen.getByText('08:00 - 18:00')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    });

    it('renders status badge', () => {
      render(<VagasTable {...defaultProps} />);
      expect(screen.getByText('Aberta')).toBeInTheDocument();
    });

    it('renders empty message when no data', () => {
      render(<VagasTable {...defaultProps} data={[]} totalCount={0} />);
      expect(screen.getByText('Nenhuma vaga encontrada')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('renders aberta status correctly', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ status: VagaStatus.ABERTA })]}
        />
      );
      expect(screen.getByText('Aberta')).toBeInTheDocument();
    });

    it('renders anunciada status correctly', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ status: VagaStatus.ANUNCIADA })]}
        />
      );
      expect(screen.getByText('Anunciada')).toBeInTheDocument();
    });

    it('renders fechada status correctly', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ status: VagaStatus.FECHADA })]}
        />
      );
      expect(screen.getByText('Fechada')).toBeInTheDocument();
    });

    it('renders cancelada status correctly', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ status: VagaStatus.CANCELADA })]}
        />
      );
      expect(screen.getByText('Cancelada')).toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('formats date in Brazilian format', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ data: new Date('2025-12-25T12:00:00') })]}
        />
      );
      expect(screen.getByText('25/12/2025')).toBeInTheDocument();
    });

    it('handles string date', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ data: '2025-06-15T12:00:00' as unknown as Date })]}
        />
      );
      expect(screen.getByText('15/06/2025')).toBeInTheDocument();
    });
  });

  describe('currency formatting', () => {
    it('formats value in BRL', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ valor: 2500.5 })]}
        />
      );
      expect(screen.getByText('R$ 2.500,50')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ valor: 0 })]}
        />
      );
      expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });
  });

  describe('hospital name resolution', () => {
    it('uses hospitalNome when available', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ hospitalNome: 'Custom Hospital' })]}
        />
      );
      expect(screen.getByText('Custom Hospital')).toBeInTheDocument();
    });

    it('falls back to hospital lookup', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ hospitalNome: undefined })]}
        />
      );
      expect(screen.getByText('Hospital Central')).toBeInTheDocument();
    });

    it('shows dash when hospital not found', () => {
      render(
        <VagasTable
          {...defaultProps}
          data={[createMockVaga({ hospitalNome: undefined, hospitalId: 'unknown' })]}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('actions dropdown', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<VagasTable {...defaultProps} />);

      const actionButton = screen.getByRole('button');
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText('Ver')).toBeInTheDocument();
        expect(screen.getByText('Editar')).toBeInTheDocument();
        expect(screen.getByText('Deletar')).toBeInTheDocument();
      });
    });

    it('calls onView when Ver is clicked', async () => {
      const onView = vi.fn();
      const user = userEvent.setup();

      render(<VagasTable {...defaultProps} onView={onView} />);

      const actionButton = screen.getByRole('button');
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText('Ver')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Ver'));

      expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });

    it('calls onEdit when Editar is clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<VagasTable {...defaultProps} onEdit={onEdit} />);

      const actionButton = screen.getByRole('button');
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Editar'));

      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });

    it('calls onDelete when Deletar is clicked', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<VagasTable {...defaultProps} onDelete={onDelete} />);

      const actionButton = screen.getByRole('button');
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.getByText('Deletar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Deletar'));

      expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });
  });

  describe('multiple rows', () => {
    it('renders multiple vagas', () => {
      const vagas = [
        createMockVaga({ id: 'vaga-1', hospitalNome: 'Hospital A' }),
        createMockVaga({ id: 'vaga-2', hospitalNome: 'Hospital B' }),
        createMockVaga({ id: 'vaga-3', hospitalNome: 'Hospital C' }),
      ];

      render(<VagasTable {...defaultProps} data={vagas} totalCount={3} />);

      expect(screen.getByText('Hospital A')).toBeInTheDocument();
      expect(screen.getByText('Hospital B')).toBeInTheDocument();
      expect(screen.getByText('Hospital C')).toBeInTheDocument();
    });
  });
});
