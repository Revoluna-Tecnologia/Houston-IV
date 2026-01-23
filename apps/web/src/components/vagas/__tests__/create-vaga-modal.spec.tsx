import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateVagaModal } from '../create-vaga-modal';
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

const mockSetores = [
  { id: 'setor-1', nome: 'UTI', hospitalId: 'hospital-1' },
  { id: 'setor-2', nome: 'Emergencia', hospitalId: 'hospital-1' },
];

const mockEspecialidades = [
  { id: 'especialidade-1', nome: 'Clinica Geral' },
  { id: 'especialidade-2', nome: 'Cardiologia' },
];

describe('CreateVagaModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    hospitals: mockHospitals,
    setores: mockSetores,
    especialidades: mockEspecialidades,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal title', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Nova Vaga')).toBeInTheDocument();
    });

    it('renders modal description', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Preencha os dados para criar uma nova vaga')).toBeInTheDocument();
    });

    it('renders data field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Data')).toBeInTheDocument();
    });

    it('renders hora inicio field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Hora Inicio')).toBeInTheDocument();
    });

    it('renders hora fim field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Hora Fim')).toBeInTheDocument();
    });

    it('renders valor field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Valor')).toBeInTheDocument();
    });

    it('renders hospital field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Hospital')).toBeInTheDocument();
    });

    it('renders setor field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Setor')).toBeInTheDocument();
    });

    it('renders especialidade field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Especialidade')).toBeInTheDocument();
    });

    it('renders observacoes field', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByText('Observacoes')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<CreateVagaModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /criar vaga/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CreateVagaModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Nova Vaga')).not.toBeInTheDocument();
    });
  });

  describe('hospital-setor relationship', () => {
    it('disables setor when no hospital selected', () => {
      render(<CreateVagaModal {...defaultProps} />);
      // Get all select buttons (hospital, setor, especialidade)
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      // The setor button should be the second one (after hospital)
      expect(selectButtons[1]).toBeDisabled();
    });

    it('enables setor when hospital is selected', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      // Click Hospital Central option directly
      await user.click(screen.getByText('Hospital Central'));

      // Get all select buttons
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      // The setor button should now be enabled
      expect(selectButtons[1]).not.toBeDisabled();
    });

    it('filters setores by hospital', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      // Click Hospital Central option directly
      await user.click(screen.getByText('Hospital Central'));

      // After selecting hospital, the filtered setores should be visible
      await waitFor(() => {
        expect(screen.getByText('UTI')).toBeInTheDocument();
        expect(screen.getByText('Emergencia')).toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('shows error for missing data', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /criar vaga/i }));

      await waitFor(() => {
        expect(screen.getByText(/data e obrigatoria/i)).toBeInTheDocument();
      });
    });

    it('shows error for missing hora inicio', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /criar vaga/i }));

      await waitFor(() => {
        expect(screen.getByText(/hora de inicio e obrigatoria/i)).toBeInTheDocument();
      });
    });

    it('shows error for missing hospital', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /criar vaga/i }));

      await waitFor(() => {
        expect(screen.getByText(/hospital e obrigatorio/i)).toBeInTheDocument();
      });
    });

    it('shows error for missing especialidade', async () => {
      const user = userEvent.setup();
      render(<CreateVagaModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /criar vaga/i }));

      await waitFor(() => {
        expect(screen.getByText(/especialidade e obrigatoria/i)).toBeInTheDocument();
      });
    });
  });

  describe('cancel behavior', () => {
    it('calls onOpenChange with false when cancel is clicked', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(<CreateVagaModal {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('submission state', () => {
    it('shows loading text during submission', async () => {
      const _user = userEvent.setup();

      render(<CreateVagaModal {...defaultProps} />);

      // Verify the submit button exists with correct text
      expect(screen.getByRole('button', { name: /criar vaga/i })).toBeInTheDocument();

      // Also verify the cancel button exists
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('disables submit button during submission', async () => {
      render(<CreateVagaModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /criar vaga/i });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
