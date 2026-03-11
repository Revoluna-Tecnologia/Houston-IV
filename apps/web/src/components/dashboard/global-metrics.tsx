'use client';

import { useTranslations } from 'next-intl';
import { useFormatCurrency } from '@/lib/format-currency';
import { StatCard } from './stat-card';
import type { Vaga, Pagamento } from '../../services/types';

const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const _XCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const AlertOctagonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export interface GlobalMetricsProps {
  vagas: Vaga[];
  pagamentos: Pagamento[];
  isLoading?: boolean;
}

export function GlobalMetrics({ vagas, pagamentos, isLoading: _isLoading }: GlobalMetricsProps) {
  const t = useTranslations('Dashboard.metrics');
  const formatCurrency = useFormatCurrency();

  const totalVagas = vagas.length;
  const vagasAbertas = vagas.filter((v) => v.status === 'aberta' || v.status === 'anunciada').length;
  const vagasFechadas = vagas.filter((v) => v.status === 'fechada').length;
  const vagasUrgentes = vagas.filter((v) => {
    const vagaDate = new Date(v.data);
    const today = new Date();
    const diffDays = Math.ceil((vagaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return (v.status === 'aberta' || v.status === 'anunciada') && diffDays <= 2 && diffDays >= 0;
  }).length;

  const candidaturasCount = 0;

  const tempoMedio = vagasFechadas > 0 ? Math.round(totalVagas / vagasFechadas) : 0;

  const folhaPagamento = pagamentos
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + (p.valor || 0), 0);

  const riscoOperacional = pagamentos
    .filter((p) => p.status === 'pendente')
    .reduce((acc, p) => acc + (p.valor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<BriefcaseIcon />}
          label={t('totalVagas')}
          value={totalVagas}
          variant="default"
        />
        <StatCard
          icon={<ClockIcon />}
          label={t('vagasAbertas')}
          value={vagasAbertas}
          variant="warning"
        />
        <StatCard
          icon={<CheckCircleIcon />}
          label={t('vagasFechadas')}
          value={vagasFechadas}
          variant="success"
        />
        <StatCard
          icon={<ClockIcon />}
          label={t('tempoMedio')}
          value={`${tempoMedio}h`}
          variant="info"
        />
        <StatCard
          icon={<UsersIcon />}
          label={t('candidaturas')}
          value={candidaturasCount}
          variant="default"
        />
        <StatCard
          icon={<AlertTriangleIcon />}
          label={t('vagasUrgentes')}
          value={vagasUrgentes}
          variant="error"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={<DollarSignIcon />}
          label={t('folhaPagamento')}
          value={formatCurrency(folhaPagamento)}
          variant="success"
        />
        <StatCard
          icon={<AlertOctagonIcon />}
          label={t('riscoOperacional')}
          value={formatCurrency(riscoOperacional)}
          variant="error"
        />
      </div>
    </div>
  );
}
