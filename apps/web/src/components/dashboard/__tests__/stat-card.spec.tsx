import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatCard } from '../stat-card';

const TestIcon = () => <svg data-testid="test-icon" />;

describe('StatCard', () => {
  describe('rendering', () => {
    it('renders label correctly', () => {
      render(<StatCard label="Total de Vagas" value={100} />);
      expect(screen.getByText('Total de Vagas')).toBeInTheDocument();
    });

    it('renders numeric value correctly', () => {
      render(<StatCard label="Test" value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders string value correctly', () => {
      render(<StatCard label="Test" value="R$ 1.500,00" />);
      expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(<StatCard label="Test" value={100} icon={<TestIcon />} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render icon container when icon not provided', () => {
      const { container } = render(<StatCard label="Test" value={100} />);
      expect(container.querySelector('.rounded-lg.p-2')).toBeNull();
    });
  });

  describe('trend indicator', () => {
    it('renders up trend with value', () => {
      render(<StatCard label="Test" value={100} trend="up" trendValue="+5%" />);
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });

    it('renders down trend with value', () => {
      render(<StatCard label="Test" value={100} trend="down" trendValue="-3%" />);
      expect(screen.getByText('-3%')).toBeInTheDocument();
    });

    it('does not render trend when only trend provided', () => {
      render(<StatCard label="Test" value={100} trend="up" />);
      expect(screen.queryByText(/\+|-/)).not.toBeInTheDocument();
    });

    it('does not render trend when only trendValue provided', () => {
      render(<StatCard label="Test" value={100} trendValue="+5%" />);
      expect(screen.queryByText('+5%')).not.toBeInTheDocument();
    });

    it('applies green color for up trend', () => {
      const { container } = render(
        <StatCard label="Test" value={100} trend="up" trendValue="+5%" />
      );
      const trendElement = container.querySelector('.text-green-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('applies red color for down trend', () => {
      const { container } = render(
        <StatCard label="Test" value={100} trend="down" trendValue="-3%" />
      );
      const trendElement = container.querySelector('.text-red-600');
      expect(trendElement).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(<StatCard label="Test" value={100} variant="default" />);
      expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
    });

    it('applies success variant styles', () => {
      const { container } = render(
        <StatCard label="Test" value={100} variant="success" icon={<TestIcon />} />
      );
      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    });

    it('applies warning variant styles', () => {
      const { container } = render(
        <StatCard label="Test" value={100} variant="warning" icon={<TestIcon />} />
      );
      expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
    });

    it('applies error variant styles', () => {
      const { container } = render(
        <StatCard label="Test" value={100} variant="error" icon={<TestIcon />} />
      );
      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    });

    it('applies info variant styles', () => {
      const { container } = render(
        <StatCard label="Test" value={100} variant="info" icon={<TestIcon />} />
      );
      expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    });

    it('uses default variant when not specified', () => {
      const { container } = render(<StatCard label="Test" value={100} />);
      expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <StatCard label="Test" value={100} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('merges custom className with existing classes', () => {
      const { container } = render(
        <StatCard label="Test" value={100} className="my-custom-class" />
      );
      const card = container.querySelector('.overflow-hidden');
      expect(card).toHaveClass('my-custom-class');
    });
  });

  describe('formatting', () => {
    it('displays large numbers correctly', () => {
      render(<StatCard label="Test" value={1000000} />);
      expect(screen.getByText('1000000')).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      render(<StatCard label="Test" value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays negative numbers correctly', () => {
      render(<StatCard label="Test" value={-50} />);
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('displays decimal numbers correctly', () => {
      render(<StatCard label="Test" value="45.5%" />);
      expect(screen.getByText('45.5%')).toBeInTheDocument();
    });
  });
});
