import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { VagasFilters, type VagasFiltersValue } from '../vagas-filters';
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
  {
    id: 'hospital-2',
    nome: 'Hospital Norte',
    grupoId: 'grupo-1',
    cnpj: '98.765.432/0001-10',
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
  { id: 'setor-3', nome: 'Cardiologia', hospitalId: 'hospital-2' },
];

const defaultFilterValue: VagasFiltersValue = {
  status: 'all',
  hospitalId: 'all',
  setorId: 'all',
  dateRange: undefined,
  search: '',
};

describe('VagasFilters', () => {
  describe('rendering', () => {
    it('renders status select', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders hospital select', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText('Hospital')).toBeInTheDocument();
    });

    it('renders setor select', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText('Setor')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText(/buscar por observacoes/i)).toBeInTheDocument();
    });

    it('renders date range picker', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText(/periodo/i)).toBeInTheDocument();
    });
  });

  describe('status filter', () => {
    it('calls onChange when status is selected', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={onChange}
        />
      );

      // Click the Abertas option directly since it's rendered in the mock
      await user.click(screen.getByText('Abertas'));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: VagaStatus.ABERTA }));
    });
  });

  describe('hospital filter', () => {
    it('calls onChange when hospital is selected', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={onChange}
        />
      );

      // Click Hospital Central option directly
      await user.click(screen.getByText('Hospital Central'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId: 'hospital-1',
          setorId: 'all',
        })
      );
    });

    it('resets setor when hospital changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={{ ...defaultFilterValue, setorId: 'setor-1', hospitalId: 'hospital-1' }}
          onChange={onChange}
        />
      );

      // Click Hospital Norte option directly
      await user.click(screen.getByText('Hospital Norte'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalId: 'hospital-2',
          setorId: 'all',
        })
      );
    });
  });

  describe('setor filter', () => {
    it('is disabled when no hospital selected', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );

      // Get all select buttons and find the one for setor (third button)
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      // The third select button should be for setor
      expect(selectButtons[2]).toBeDisabled();
    });

    it('is enabled when hospital is selected', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={{ ...defaultFilterValue, hospitalId: 'hospital-1' }}
          onChange={vi.fn()}
        />
      );

      // Get all select buttons and find the one for setor (third button)
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      // The third select button should be for setor
      expect(selectButtons[2]).not.toBeDisabled();
    });
  });

  describe('search filter', () => {
    it('calls onChange when search text is entered', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={onChange}
        />
      );

      await user.type(screen.getByPlaceholderText(/buscar por observacoes/i), 'plantao');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'plantao' })
      );
    });
  });

  describe('clear filters', () => {
    it('shows clear button when filters are active', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={{ ...defaultFilterValue, status: VagaStatus.ABERTA }}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
    });

    it('hides clear button when no filters are active', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={defaultFilterValue}
          onChange={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={{
            status: VagaStatus.ABERTA,
            hospitalId: 'hospital-1',
            setorId: 'setor-1',
            dateRange: undefined,
            search: 'test',
          }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

      expect(onChange).toHaveBeenCalledWith({
        status: 'all',
        hospitalId: 'all',
        setorId: 'all',
        dateRange: undefined,
        search: '',
      });
    });
  });

  describe('loading state', () => {
    it('disables clear button when loading', () => {
      render(
        <VagasFilters
          hospitals={mockHospitals}
          setores={mockSetores}
          value={{ ...defaultFilterValue, status: VagaStatus.ABERTA }}
          onChange={vi.fn()}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeDisabled();
    });
  });
});
