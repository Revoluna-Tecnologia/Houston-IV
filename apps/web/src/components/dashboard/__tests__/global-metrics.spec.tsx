import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { GlobalMetrics } from '../global-metrics';
import { VagaStatus, PagamentoStatus } from '../../../services/types';
import type { Vaga, Pagamento } from '../../../services/types';

const createMockVaga = (overrides: Partial<Vaga> = {}): Vaga => ({
  id: `vaga-${Math.random().toString(36).substr(2, 9)}`,
  data: new Date(),
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
  ...overrides,
});

const createMockPagamento = (overrides: Partial<Pagamento> = {}): Pagamento => ({
  id: `pagamento-${Math.random().toString(36).substr(2, 9)}`,
  vagaId: 'vaga-1',
  medicoId: 'medico-1',
  valor: 1500,
  status: PagamentoStatus.PENDENTE,
  dataAutorizacao: null,
  dataPagamento: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('GlobalMetrics', () => {
  describe('vagas metrics', () => {
    it('displays total vagas count', () => {
      const vagas = [createMockVaga(), createMockVaga(), createMockVaga()];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const totalCard = screen.getByText('Total de Vagas').parentElement;
      expect(totalCard).toHaveTextContent('3');
    });

    it('displays zero for empty vagas', () => {
      render(<GlobalMetrics vagas={[]} pagamentos={[]} />);
      const totalCard = screen.getByText('Total de Vagas').parentElement;
      expect(totalCard).toHaveTextContent('0');
    });

    it('displays vagas abertas count', () => {
      const vagas = [
        createMockVaga({ status: VagaStatus.ABERTA }),
        createMockVaga({ status: VagaStatus.ABERTA }),
        createMockVaga({ status: VagaStatus.FECHADA }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const abertasCard = screen.getByText('Vagas Abertas').parentElement;
      expect(abertasCard).toHaveTextContent('2');
    });

    it('counts anunciada as abertas', () => {
      const vagas = [
        createMockVaga({ status: VagaStatus.ANUNCIADA }),
        createMockVaga({ status: VagaStatus.ANUNCIADA }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const abertasCard = screen.getByText('Vagas Abertas').parentElement;
      expect(abertasCard).toHaveTextContent('2');
    });

    it('displays vagas fechadas count', () => {
      const vagas = [
        createMockVaga({ status: VagaStatus.FECHADA }),
        createMockVaga({ status: VagaStatus.FECHADA }),
        createMockVaga({ status: VagaStatus.ABERTA }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const fechadasCard = screen.getByText('Vagas Fechadas').parentElement;
      expect(fechadasCard).toHaveTextContent('2');
    });
  });

  describe('vagas urgentes', () => {
    it('counts urgent vagas (within 2 days)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const vagas = [
        createMockVaga({ status: VagaStatus.ABERTA, data: tomorrow }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const urgentesCard = screen.getByText('Vagas Urgentes').parentElement;
      expect(urgentesCard).toHaveTextContent('1');
    });

    it('does not count fechadas as urgent', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const vagas = [
        createMockVaga({ status: VagaStatus.FECHADA, data: tomorrow }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const urgentesCard = screen.getByText('Vagas Urgentes').parentElement;
      expect(urgentesCard).toHaveTextContent('0');
    });

    it('does not count past dates as urgent', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const vagas = [
        createMockVaga({ status: VagaStatus.ABERTA, data: pastDate }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const urgentesCard = screen.getByText('Vagas Urgentes').parentElement;
      expect(urgentesCard).toHaveTextContent('0');
    });

    it('does not count far future dates as urgent', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const vagas = [
        createMockVaga({ status: VagaStatus.ABERTA, data: futureDate }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const urgentesCard = screen.getByText('Vagas Urgentes').parentElement;
      expect(urgentesCard).toHaveTextContent('0');
    });
  });

  describe('tempo medio', () => {
    it('displays tempo medio in hours', () => {
      const vagas = [
        createMockVaga({ status: VagaStatus.FECHADA }),
        createMockVaga({ status: VagaStatus.FECHADA }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const tempoCard = screen.getByText('Tempo Medio').parentElement;
      expect(tempoCard).toHaveTextContent(/\d+h/);
    });

    it('displays 0h when no fechadas', () => {
      const vagas = [
        createMockVaga({ status: VagaStatus.ABERTA }),
      ];
      render(<GlobalMetrics vagas={vagas} pagamentos={[]} />);
      const tempoCard = screen.getByText('Tempo Medio').parentElement;
      expect(tempoCard).toHaveTextContent('0h');
    });
  });

  describe('pagamentos metrics', () => {
    it('calculates folha de pagamento total', () => {
      const pagamentos = [
        createMockPagamento({ valor: 1000, status: PagamentoStatus.PENDENTE }),
        createMockPagamento({ valor: 2000, status: PagamentoStatus.PAGO }),
        createMockPagamento({ valor: 1500, status: PagamentoStatus.AUTORIZADO }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const folhaCard = screen.getByText('Folha de Pagamento').parentElement;
      expect(folhaCard).toHaveTextContent('R$ 4.500,00');
    });

    it('excludes cancelados from folha de pagamento', () => {
      const pagamentos = [
        createMockPagamento({ valor: 1000, status: PagamentoStatus.PENDENTE }),
        createMockPagamento({ valor: 2000, status: PagamentoStatus.CANCELADO }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const folhaCard = screen.getByText('Folha de Pagamento').parentElement;
      expect(folhaCard).toHaveTextContent('R$ 1.000,00');
    });

    it('calculates risco operacional from pendentes', () => {
      const pagamentos = [
        createMockPagamento({ valor: 1000, status: PagamentoStatus.PENDENTE }),
        createMockPagamento({ valor: 500, status: PagamentoStatus.PENDENTE }),
        createMockPagamento({ valor: 2000, status: PagamentoStatus.PAGO }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const riscoCard = screen.getByText('Risco Operacional').parentElement;
      expect(riscoCard).toHaveTextContent('R$ 1.500,00');
    });

    it('displays zero risco when no pendentes', () => {
      const pagamentos = [
        createMockPagamento({ valor: 2000, status: PagamentoStatus.PAGO }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const riscoCard = screen.getByText('Risco Operacional').parentElement;
      expect(riscoCard).toHaveTextContent('R$ 0,00');
    });
  });

  describe('labels', () => {
    it('renders all metric labels', () => {
      render(<GlobalMetrics vagas={[]} pagamentos={[]} />);

      expect(screen.getByText('Total de Vagas')).toBeInTheDocument();
      expect(screen.getByText('Vagas Abertas')).toBeInTheDocument();
      expect(screen.getByText('Vagas Fechadas')).toBeInTheDocument();
      expect(screen.getByText('Tempo Medio')).toBeInTheDocument();
      expect(screen.getByText('Candidaturas')).toBeInTheDocument();
      expect(screen.getByText('Vagas Urgentes')).toBeInTheDocument();
      expect(screen.getByText('Folha de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Risco Operacional')).toBeInTheDocument();
    });
  });

  describe('currency formatting', () => {
    it('formats currency in BRL', () => {
      const pagamentos = [
        createMockPagamento({ valor: 1234.56, status: PagamentoStatus.PENDENTE }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const folhaCard = screen.getByText('Folha de Pagamento').parentElement;
      expect(folhaCard).toHaveTextContent('R$ 1.234,56');
    });

    it('handles large currency values', () => {
      const pagamentos = [
        createMockPagamento({ valor: 100000, status: PagamentoStatus.PENDENTE }),
      ];
      render(<GlobalMetrics vagas={[]} pagamentos={pagamentos} />);
      const folhaCard = screen.getByText('Folha de Pagamento').parentElement;
      expect(folhaCard).toHaveTextContent('R$ 100.000,00');
    });
  });
});
